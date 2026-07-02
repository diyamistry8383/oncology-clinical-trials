"""
Read-only API for ingested trials. Write/ingestion happens via the
trials_ingest CLI (Step 2) — this router just exposes what's in Postgres
so the frontend (Step 7) and manual testing can browse it.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.trial import Trial
from app.schemas.trial import TrialRead

router = APIRouter()
import logging
from sqlalchemy import cast, String
from pydantic import BaseModel
from app.config import get_settings
from anthropic import AsyncAnthropic

logger = logging.getLogger("trials_api")

class TrialCompareRequest(BaseModel):
    trial_ids: list[uuid.UUID]


@router.get("", response_model=list[TrialRead])
async def list_trials(
    db: AsyncSession = Depends(get_db),
    status: str | None = Query(default=None, description="Filter by overall status, e.g. RECRUITING"),
    cancer_type: str | None = Query(default=None, description="Filter by cancer type / condition"),
    phase: str | None = Query(default=None, description="Filter by clinical trial phase"),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
):
    query = select(Trial)
    if status:
        query = query.where(Trial.status == status)
    if cancer_type:
        query = query.where(
            (Trial.conditions.cast(String).ilike(f"%{cancer_type}%")) |
            (Trial.title.ilike(f"%{cancer_type}%")) |
            (Trial.brief_summary.ilike(f"%{cancer_type}%"))
        )
    if phase:
        query = query.where(Trial.phase.ilike(f"%{phase}%"))
        
    query = query.order_by(Trial.last_synced_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{trial_id}", response_model=TrialRead)
async def get_trial(trial_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    trial = await db.get(Trial, trial_id)
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")
    return trial


@router.get("/by-nct/{nct_id}", response_model=TrialRead)
async def get_trial_by_nct_id(nct_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Trial).where(Trial.nct_id == nct_id))
    trial = result.scalar_one_or_none()
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")
    return trial


@router.get("/{trial_id}/ai-summary")
async def get_ai_trial_summary(trial_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Generate a simplified, patient-friendly AI trial summary."""
    trial = await db.get(Trial, trial_id)
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")

    structured = trial.eligibility_structured or {}
    if "ai_trial_summary" in structured and structured["ai_trial_summary"]:
        return {"summary": structured["ai_trial_summary"]}

    settings = get_settings()
    has_valid_key = (
        settings.ANTHROPIC_API_KEY 
        and not settings.ANTHROPIC_API_KEY.startswith("sk-ant-your-key")
        and settings.ANTHROPIC_API_KEY != "your-key-here"
    )

    summary_text = ""
    if has_valid_key:
        try:
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            prompt = (
                f"Generate a simplified, layman-friendly clinical trial summary for an oncologist to share with a patient.\n"
                f"Trial Title: {trial.title}\n"
                f"Brief Summary: {trial.brief_summary}\n"
                f"Eligibility criteria (raw):\n{trial.eligibility_criteria_raw or 'No criteria'}\n\n"
                f"Format the summary as a 2-3 paragraph explanation of the trial purpose, treatment arms, and key eligibility requirements."
            )
            response = await client.messages.create(
                model=settings.LLM_MODEL,
                max_tokens=600,
                messages=[{"role": "user", "content": prompt}],
            )
            summary_text = next((b.text for b in response.content if b.type == "text"), "").strip()
        except Exception as e:
            logger.warning("LLM trial summary failed: %s", e)

    if not summary_text:
        age_str = f"ages {trial.minimum_age or '18+'} to {trial.maximum_age or 'any'}"
        biomarkers_str = ", ".join(structured.get("biomarkers", [])) if structured.get("biomarkers") else "no specific biomarkers"
        treatments_str = ", ".join(structured.get("prior_treatment", [])) if structured.get("prior_treatment") else "standard oncology therapy"
        summary_text = (
            f"This is a {trial.phase or 'unspecified phase'} clinical trial for patients diagnosed with {', '.join(trial.conditions) if trial.conditions else 'cancer'}. "
            f"The trial eligibility criteria requires patients to match the age group of {age_str}. "
            f"Matching key biomarkers for this trial include: {biomarkers_str}. "
            f"Prior treatment criteria checks for history of: {treatments_str}."
        )

    # Cache the result in postgres
    structured["ai_trial_summary"] = summary_text
    trial.eligibility_structured = structured
    await db.commit()
    return {"summary": summary_text}


@router.post("/compare")
async def compare_trials(payload: TrialCompareRequest, db: AsyncSession = Depends(get_db)):
    """Compare multiple clinical trials side-by-side."""
    if not payload.trial_ids:
        raise HTTPException(status_code=400, detail="Must provide at least one trial ID")

    result = await db.execute(select(Trial).where(Trial.id.in_(payload.trial_ids)))
    trials = result.scalars().all()

    if not trials:
        raise HTTPException(status_code=404, detail="No trials found matching provided IDs")

    side_by_side = []
    for t in trials:
        structured = t.eligibility_structured or {}
        side_by_side.append({
            "id": str(t.id),
            "nct_id": t.nct_id,
            "title": t.title,
            "phase": t.phase,
            "status": t.status,
            "conditions": t.conditions,
            "min_age": t.minimum_age,
            "max_age": t.maximum_age,
            "sex": t.sex,
            "biomarkers": structured.get("biomarkers", []),
            "prior_treatments": structured.get("prior_treatment", []),
            "locations": t.locations
        })

    settings = get_settings()
    has_valid_key = (
        settings.ANTHROPIC_API_KEY 
        and not settings.ANTHROPIC_API_KEY.startswith("sk-ant-your-key")
        and settings.ANTHROPIC_API_KEY != "your-key-here"
    )

    comparison_text = ""
    if has_valid_key and len(trials) > 1:
        try:
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            trials_descriptions = []
            for i, t in enumerate(trials):
                structured = t.eligibility_structured or {}
                desc = (
                    f"Trial {i+1} ({t.nct_id}): {t.title}\n"
                    f"Phase: {t.phase}\n"
                    f"Biomarkers: {structured.get('biomarkers')}\n"
                    f"Prior Treatments: {structured.get('prior_treatment')}\n"
                    f"Summary: {t.brief_summary[:200] if t.brief_summary else ''}..."
                )
                trials_descriptions.append(desc)

            prompt = (
                "You are comparing clinical trials side-by-side for an oncologist.\n"
                "Please analyze the differences and similarities between these trials:\n\n"
                + "\n\n".join(trials_descriptions) + "\n\n"
                "Write a concise comparison (4-6 sentences) highlighting: "
                "1. Different biomarker eligibility requirements, 2. Lines of prior therapy exclusions, "
                "3. Patient convenience (e.g. phases, conditions)."
            )
            response = await client.messages.create(
                model=settings.LLM_MODEL,
                max_tokens=600,
                messages=[{"role": "user", "content": prompt}],
            )
            comparison_text = next((b.text for b in response.content if b.type == "text"), "").strip()
        except Exception as e:
            logger.warning("LLM trial comparison failed: %s", e)

    if not comparison_text:
        if len(trials) == 1:
            comparison_text = f"Only one trial selected: {trials[0].nct_id} ({trials[0].title[:100]}...)."
        else:
            comparison_text = (
                f"Comparing {len(trials)} trials: {', '.join(t.nct_id for t in trials)}. "
                "Key difference analysis: " + " · ".join(
                    f"{t.nct_id} ({t.phase or 'unspecified phase'}, target biomarkers: {', '.join(t.eligibility_structured.get('biomarkers', [])) if t.eligibility_structured and t.eligibility_structured.get('biomarkers') else 'None'})"
                    for t in trials
                )
            )

    return {
        "comparison_text": comparison_text,
        "trials": side_by_side
    }
