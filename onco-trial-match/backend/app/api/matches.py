"""
API for running and viewing patient-to-trial matches.

POST /patients/{id}/match runs semantic search (Step 4) to find candidate
trials, then optionally generates an LLM eligibility summary for each one
(Step 5) explaining why it matched and what an oncologist should verify.
Results are persisted as Match rows for later review.
"""
import asyncio
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.matching.llm_summary import generate_eligibility_summary
from app.matching.semantic_search import find_matching_trials
from app.models.match import Match, MatchStatus
from app.models.patient import Patient
from app.models.trial import Trial
from app.schemas.match import MatchDecision, MatchRead, MatchRequest

logger = logging.getLogger("matches_api")

router = APIRouter()

_VALID_DECISION_ACTIONS = {status.value for status in MatchStatus} - {"pending"}


@router.post("/patients/{patient_id}/match", response_model=list[MatchRead])
async def match_patient_to_trials(
    patient_id: uuid.UUID, payload: MatchRequest, db: AsyncSession = Depends(get_db)
):
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    candidates = await find_matching_trials(patient, top_k=payload.top_k)
    if not candidates:
        return []

    nct_ids = [c.nct_id for c in candidates]
    result = await db.execute(select(Trial).where(Trial.nct_id.in_(nct_ids)))
    trials_by_nct = {t.nct_id: t for t in result.scalars().all()}

    from app.matching.eligibility_scoring import calculate_match_score

    # Build (trial, recommendation_score) pairs by running the composite scoring engine
    ranked_trials: list[tuple[Trial, float]] = []
    for candidate in candidates:
        trial = trials_by_nct.get(candidate.nct_id)
        if not trial:
            continue
        score_info = calculate_match_score(patient, trial, candidate.similarity_score)
        rec_score = score_info["score"] / 100.0
        ranked_trials.append((trial, rec_score))

    # Sort trials by recommendation score descending (Feature 10)
    ranked_trials.sort(key=lambda x: x[1], reverse=True)

    # Generate LLM summaries concurrently (independent API calls) rather than
    # one-at-a-time, since each summary takes a few seconds — sequential
    # calls for top_k=5 would otherwise make this endpoint noticeably slow.
    summaries: list[dict | None] = [None] * len(ranked_trials)
    if payload.include_llm_summary and ranked_trials:
        async def _summarize(index: int, trial: Trial, score: float) -> None:
            try:
                summary = await generate_eligibility_summary(patient, trial, similarity_score=score)
                summaries[index] = summary.model_dump()
            except Exception:
                logger.warning(
                    "Failed to generate LLM summary for trial %s — leaving null",
                    trial.nct_id,
                    exc_info=True,
                )

        await asyncio.gather(
            *(_summarize(i, trial, score) for i, (trial, score) in enumerate(ranked_trials))
        )

    created_matches: list[Match] = []
    for (trial, score), summary_dict in zip(ranked_trials, summaries):
        # Use LLM-generated match percentage if available
        final_score = score
        if summary_dict and "match_percentage" in summary_dict:
            final_score = summary_dict["match_percentage"] / 100.0

        match = Match(
            patient_id=patient.id,
            trial_id=trial.id,
            similarity_score=final_score,
            llm_summary=summary_dict,
            status="pending",
        )
        db.add(match)
        created_matches.append(match)

    await db.commit()
    # lazy="joined" on Match.trial means the relationship loads automatically
    # on next query, but freshly-created objects in this session need an
    # explicit refresh to populate it before serialization.
    for match in created_matches:
        await db.refresh(match, attribute_names=["trial"])

    # Re-sort created matches by their final similarity_score to keep matches ranked
    created_matches.sort(key=lambda m: m.similarity_score, reverse=True)
    return created_matches


@router.get("/patients/{patient_id}/matches", response_model=list[MatchRead])
async def list_patient_matches(patient_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    query = (
        select(Match)
        .where(Match.patient_id == patient_id)
        .order_by(Match.similarity_score.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/matches/{match_id}", response_model=MatchRead)
async def get_match(match_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    match = await db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


@router.post("/matches/{match_id}/decision", response_model=MatchRead)
async def record_match_decision(
    match_id: uuid.UUID, payload: MatchDecision, db: AsyncSession = Depends(get_db)
):
    """
    Oncologist review decision on a match: approve, reject, refer, or
    enroll. This is the "oncologist review & refer workflow" + "enrollment
    tracker" surface from the project brief — status transitions here are
    what the enrollment tracker (Step 6/frontend) reads from.
    """
    match = await db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if payload.action not in _VALID_DECISION_ACTIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid action '{payload.action}'. Must be one of: {sorted(_VALID_DECISION_ACTIONS)}",
        )

    match.status = payload.action
    if payload.notes is not None:
        match.oncologist_notes = payload.notes
    match.reviewed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(match, attribute_names=["trial"])
    return match