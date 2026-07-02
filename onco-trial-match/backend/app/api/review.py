"""
Oncologist review surfaces that operate across all patients, rather than
being scoped to one patient like app/api/matches.py:

- GET /review/queue: every pending match, oldest first, so an oncologist
  can work through a queue without needing to know patient IDs up front.
- GET /review/enrollment-tracker: per-patient rollup of match status
  counts (pending/approved/rejected/referred/enrolled), the "enrollment
  enrollment tracker" feature from the project brief.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.match import Match, MatchStatus
from app.models.patient import Patient
from app.schemas.match import MatchRead
from app.schemas.review import EnrollmentTrackerRow

router = APIRouter()


@router.get("/review/queue", response_model=list[MatchRead])
async def get_review_queue(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
):
    """
    All matches still awaiting oncologist review, oldest first (so the
    queue drains in the order matches were generated rather than jumping
    around). Filters out anything already approved/rejected/referred/enrolled.
    """
    query = (
        select(Match)
        .where(Match.status == MatchStatus.pending.value)
        .order_by(Match.created_at.asc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/review/enrollment-tracker", response_model=list[EnrollmentTrackerRow])
async def get_enrollment_tracker(db: AsyncSession = Depends(get_db)):
    """
    One row per patient who has at least one match, with counts of matches
    in each status. Lets an oncologist/coordinator see at a glance which
    patients still have pending reviews vs. which have an active referral
    or enrollment in progress.
    """
    # Pull all patients with matches, plus their matches' statuses, in one
    # query rather than N+1 per-patient queries.
    query = (
        select(Patient.id, Patient.display_name, Match.status, func.count(Match.id))
        .join(Match, Match.patient_id == Patient.id)
        .group_by(Patient.id, Patient.display_name, Match.status)
    )
    result = await db.execute(query)
    rows = result.all()

    # Pivot the (patient, status, count) rows into one row per patient with
    # a count per status.
    tracker: dict = {}
    for patient_id, display_name, status, count in rows:
        if patient_id not in tracker:
            tracker[patient_id] = {
                "patient_id": patient_id,
                "patient_name": display_name,
                "pending_count": 0,
                "approved_count": 0,
                "rejected_count": 0,
                "referred_count": 0,
                "enrolled_count": 0,
                "total_matches": 0,
            }
        tracker[patient_id][f"{status}_count"] = count
        tracker[patient_id]["total_matches"] += count

    return list(tracker.values())