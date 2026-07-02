import uuid

from pydantic import BaseModel


class EnrollmentTrackerRow(BaseModel):
    """One row in the enrollment tracker: a patient plus counts of their
    matches in each status. Used by GET /review/enrollment-tracker."""

    patient_id: uuid.UUID
    patient_name: str
    pending_count: int = 0
    approved_count: int = 0
    rejected_count: int = 0
    referred_count: int = 0
    enrolled_count: int = 0
    total_matches: int = 0