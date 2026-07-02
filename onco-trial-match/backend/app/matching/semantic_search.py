"""
Core matching logic: given a patient, embed their clinical profile and
query ChromaDB for the top-K most semantically similar trials by
eligibility-criteria text.

This module returns raw similarity results (trial vector IDs + scores).
Turning those into full Trial records + LLM eligibility summaries is the
job of the matches API router (Step 5), which builds on top of this.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.embeddings.patient_embedder import embed_patient_profile
from app.models.patient import Patient
from app.vectorstore import query_similar_trials


@dataclass
class TrialMatchCandidate:
    """One result from the semantic search, before any LLM summary is attached."""

    nct_id: str
    similarity_score: float
    matched_document_text: str


def _distance_to_similarity(distance: float) -> float:
    """
    ChromaDB's cosine space returns a distance (0 = identical, 2 = opposite)
    rather than a similarity score. Convert to a more intuitive 0-1
    similarity score, where 1 means identical and 0 means maximally dissimilar.
    """
    return max(0.0, 1.0 - (distance / 2.0))


async def find_matching_trials(patient: Patient, top_k: int = 5) -> list[TrialMatchCandidate]:
    """
    Embed the patient's clinical profile and return the top-K most
    semantically similar trials, ranked by similarity score (descending).

    Note: this does basic semantic similarity only — it does NOT yet apply
    hard eligibility filters (e.g. age range, sex). Combining semantic
    ranking with structured-field filtering is a natural follow-up once
    match quality on real data has been reviewed; for now, semantic
    similarity surfaces good candidates for the oncologist to review
    against the full eligibility text themselves.
    """
    query_embedding = await embed_patient_profile(patient)
    results = query_similar_trials(query_embedding=query_embedding, top_k=top_k)

    candidates: list[TrialMatchCandidate] = []

    # ChromaDB query() results are batched (one batch per query embedding);
    # since we send exactly one query embedding, everything is at index 0.
    ids = results.get("ids", [[]])[0]
    distances = results.get("distances", [[]])[0]
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]

    for i, _vector_id in enumerate(ids):
        metadata = metadatas[i] if i < len(metadatas) else {}
        nct_id = metadata.get("nct_id") if metadata else None
        if not nct_id:
            continue  # skip malformed entries rather than crash the whole match

        distance = distances[i] if i < len(distances) else 2.0
        document_text = documents[i] if i < len(documents) else ""

        candidates.append(
            TrialMatchCandidate(
                nct_id=nct_id,
                similarity_score=_distance_to_similarity(distance),
                matched_document_text=document_text,
            )
        )

    return candidates
