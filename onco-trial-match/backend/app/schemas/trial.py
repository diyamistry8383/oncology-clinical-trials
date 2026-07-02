import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TrialBase(BaseModel):
    nct_id: str
    title: str
    brief_summary: str | None = None
    status: str = "RECRUITING"
    phase: str | None = None
    conditions: list[str] = []
    locations: list[dict] = []
    eligibility_criteria_raw: str | None = None
    minimum_age: str | None = None
    maximum_age: str | None = None
    sex: str | None = None


class TrialCreate(TrialBase):
    pass


class TrialRead(TrialBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    eligibility_structured: dict | None = None
    created_at: datetime
    last_synced_at: datetime


class TrialSummary(BaseModel):
    """Lightweight shape used inside match results, where the full trial
    record would be more than the frontend needs."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nct_id: str
    title: str
    phase: str | None = None
    status: str
