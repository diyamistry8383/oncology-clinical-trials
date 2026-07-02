"""
Main ingestion pipeline: fetch recruiting oncology trials from
ClinicalTrials.gov, upsert structured fields into PostgreSQL, and chunk +
store eligibility-criteria text in ChromaDB for semantic search later.

CLI usage:
    python -m app.ingestion.trials_ingest --max-trials 200
    python -m app.ingestion.trials_ingest --condition "breast cancer" --max-trials 50

Embeddings use the real BioBERT-derived sentence embedder (Step 4,
app.embeddings.biobert_embedder) — see that module for model choice.
"""
from __future__ import annotations

import argparse
import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import AsyncSessionLocal, init_db
from app.embeddings.biobert_embedder import embed_text
from app.ingestion.clinicaltrials_client import ClinicalTrialsClient
from app.ingestion.normalizer import normalize_studies
from app.ingestion.text_chunking import chunk_eligibility_text
from app.models.trial import Trial
from app.nlp.eligibility_parser import parse_eligibility_criteria
from app.vectorstore import delete_trials_collection, upsert_trial_embedding

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("trials_ingest")


async def upsert_trial_record(db: AsyncSession, trial_data: dict) -> Trial:
    """Insert a trial, or update it in place if the nct_id already exists."""
    result = await db.execute(select(Trial).where(Trial.nct_id == trial_data["nct_id"]))
    existing = result.scalar_one_or_none()

    if existing:
        for key, value in trial_data.items():
            setattr(existing, key, value)
        trial = existing
    else:
        trial = Trial(**trial_data)
        db.add(trial)

    await db.flush()  # assigns trial.id without committing the whole transaction
    return trial


async def store_trial_embedding(trial: Trial) -> None:
    """Chunk the trial's eligibility text and store an embedding in ChromaDB."""
    if not trial.eligibility_criteria_raw:
        logger.warning("Trial %s has no eligibility criteria text — skipping embedding", trial.nct_id)
        return

    chunks = chunk_eligibility_text(trial.eligibility_criteria_raw)
    if not chunks:
        return

    # One embedding per trial using the joined chunks; per-chunk retrieval
    # + re-ranking would let very long eligibility text dominate the
    # embedding, which is a refinement for later if matching quality
    # warrants it.
    combined_text = "\n".join(chunks)

    # embed_text() runs the model synchronously (CPU-bound) — push it to a
    # thread so it doesn't block the event loop while ingesting many trials.
    loop = asyncio.get_running_loop()
    embedding = await loop.run_in_executor(None, embed_text, combined_text)

    upsert_trial_embedding(
        trial_id=str(trial.id),
        embedding=embedding,
        document_text=combined_text,
        metadata={
            "nct_id": trial.nct_id,
            "title": trial.title,
            "status": trial.status,
            "conditions": ", ".join(trial.conditions or []),
        },
    )
    trial.vector_id = trial.nct_id


async def parse_and_store_eligibility(trial: Trial, use_llm_fallback: bool) -> None:
    """Run the eligibility NLP parser (Step 3) and store the result on the trial."""
    parsed = await parse_eligibility_criteria(
        raw_text=trial.eligibility_criteria_raw,
        minimum_age_field=trial.minimum_age,
        maximum_age_field=trial.maximum_age,
        use_llm_fallback=use_llm_fallback,
    )
    trial.eligibility_structured = parsed.model_dump()


async def run_ingestion(
    condition: str, max_trials: int, use_llm_fallback: bool = True, reset_collection: bool = False
) -> int:
    """Run the full ingestion pipeline once. Returns the number of trials processed."""
    await init_db()

    if reset_collection:
        logger.info("Resetting trials vector collection (embedding model/dimension changed)")
        delete_trials_collection()

    client = ClinicalTrialsClient()
    try:
        logger.info("Fetching up to %d recruiting trials for condition=%r", max_trials, condition)
        raw_studies = await client.fetch_recruiting_trials(condition=condition, max_trials=max_trials)
        logger.info("Fetched %d raw studies", len(raw_studies))
    finally:
        await client.close()

    normalized = normalize_studies(raw_studies)
    logger.info("Normalized %d studies with usable NCT IDs", len(normalized))

    processed = 0
    async with AsyncSessionLocal() as db:
        for trial_data in normalized:
            try:
                trial = await upsert_trial_record(db, trial_data)
                await parse_and_store_eligibility(trial, use_llm_fallback=use_llm_fallback)
                await store_trial_embedding(trial)
                processed += 1
                logger.info("Ingested %s (%s)", trial.nct_id, trial.title[:60])
            except Exception:
                logger.exception("Failed to ingest trial %s — continuing", trial_data.get("nct_id"))

        await db.commit()

    logger.info("Ingestion complete: %d/%d trials processed", processed, len(normalized))
    return processed


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest oncology trials from ClinicalTrials.gov")
    parser.add_argument("--condition", default="cancer", help="Condition query term (default: 'cancer')")
    parser.add_argument("--max-trials", type=int, default=200, help="Max trials to fetch (default: 200)")
    parser.add_argument(
        "--no-llm-fallback",
        action="store_true",
        help="Disable LLM-assisted eligibility parsing (rule-based only — no API key needed)",
    )
    parser.add_argument(
        "--reset-vectors",
        action="store_true",
        help="Delete and recreate the ChromaDB trials collection before ingesting "
        "(required once after switching embedding models/dimensions, e.g. after Step 4)",
    )
    args = parser.parse_args()

    asyncio.run(
        run_ingestion(
            condition=args.condition,
            max_trials=args.max_trials,
            use_llm_fallback=not args.no_llm_fallback,
            reset_collection=args.reset_vectors,
        )
    )


if __name__ == "__main__":
    main()
