import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.trial import TrialSummary


class LLMEligibilitySummary(BaseModel):
    """Structured output expected from app.matching.llm_summary."""

    likely_eligible: bool
    matched_criteria: list[str] = []
    concerns: list[str] = []
    summary_text: str
    match_percentage: int = 0
    risk_level: str = "Low"
    risk_reasons: list[str] = []
    reasons_eligible: list[str] = []
    reasons_ineligible: list[str] = []


class MatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    trial: TrialSummary
    similarity_score: float
    llm_summary: LLMEligibilitySummary | None = None
    status: str
    oncologist_notes: str | None = None
    created_at: datetime
    reviewed_at: datetime | None = None


class MatchDecision(BaseModel):
    """
    action must be one of the non-pending MatchStatus values directly
    (i.e. past-tense status names, not verbs) — "approved", "rejected",
    "referred", or "enrolled" — since this sets Match.status verbatim.
    """

    action: str
    notes: str | None = None


class MatchRequest(BaseModel):
    """Body for POST /patients/{id}/match — lets the caller override top_k."""

    top_k: int = 5
    include_llm_summary: bool = True