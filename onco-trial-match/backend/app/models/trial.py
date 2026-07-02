"""
Trial model: stores structured data ingested from ClinicalTrials.gov
plus the parsed eligibility criteria produced by the NLP eligibility parser.
"""
import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Trial(Base):
    __tablename__ = "trials"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # ClinicalTrials.gov NCT identifier, e.g. "NCT05123456"
    nct_id: Mapped[str] = mapped_column(String(20), unique=True, index=True)

    title: Mapped[str] = mapped_column(Text)
    brief_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="RECRUITING")
    phase: Mapped[str | None] = mapped_column(String(50), nullable=True)

    conditions: Mapped[list] = mapped_column(JSON, default=list)
    locations: Mapped[list] = mapped_column(JSON, default=list)

    # Raw eligibility criteria text as published on ClinicalTrials.gov
    eligibility_criteria_raw: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Structured output of app.nlp.eligibility_parser
    # shape: {inclusion: [...], exclusion: [...], age_range: {...}, biomarkers: [...], prior_treatment: [...]}
    eligibility_structured: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    minimum_age: Mapped[str | None] = mapped_column(String(20), nullable=True)
    maximum_age: Mapped[str | None] = mapped_column(String(20), nullable=True)
    sex: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # ID used to look this trial's embedding up in ChromaDB (mirrors nct_id)
    vector_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    last_synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<Trial nct_id={self.nct_id} status={self.status}>"
