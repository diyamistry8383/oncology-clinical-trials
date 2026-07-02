"""
Match model: links a Patient to a Trial with a similarity score, the
LLM-generated eligibility summary, and the oncologist's review decision.
"""
import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.trial import Trial


class MatchStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    referred = "referred"
    enrolled = "enrolled"


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id"), index=True
    )
    trial_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trials.id"), index=True
    )

    # lazy="joined" loads the related Trial via a SQL JOIN automatically
    # whenever a Match is queried, so API code doesn't need to manually
    # refresh/eager-load this relationship before serializing match.trial.
    trial: Mapped["Trial"] = relationship("Trial", lazy="joined")

    similarity_score: Mapped[float] = mapped_column(Float)

    # Structured output of app.matching.llm_summary.generate_eligibility_summary
    # shape: {likely_eligible: bool, matched_criteria: [...], concerns: [...], summary_text: str}
    llm_summary: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    status: Mapped[str] = mapped_column(String(20), default=MatchStatus.pending.value)
    oncologist_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"<Match patient={self.patient_id} trial={self.trial_id} status={self.status}>"
