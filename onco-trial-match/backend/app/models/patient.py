"""
Patient model: structured clinical profile used as the input side of matching.
In production this would be sourced from an EHR/FHIR feed; for development
it is populated by app/scripts/seed_synthea_patients.py using Synthea
synthetic oncology patient bundles.
"""
import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Display name / MRN — synthetic data only, never real PHI in this project
    display_name: Mapped[str] = mapped_column(String(120))
    age: Mapped[int] = mapped_column(Integer)
    sex: Mapped[str] = mapped_column(String(20))

    primary_diagnosis: Mapped[str] = mapped_column(Text)  # e.g. "Stage III NSCLC"
    cancer_type: Mapped[str] = mapped_column(String(120))
    stage: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ecog_status: Mapped[int | None] = mapped_column(Integer, nullable=True)

    biomarkers: Mapped[list] = mapped_column(JSON, default=list)  # e.g. ["EGFR+", "PD-L1 50%"]
    prior_treatments: Mapped[list] = mapped_column(JSON, default=list)
    comorbidities: Mapped[list] = mapped_column(JSON, default=list)

    # Free-text clinical note, used to build the embedding for semantic search
    clinical_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    source: Mapped[str] = mapped_column(String(50), default="synthea")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<Patient {self.display_name} dx={self.primary_diagnosis}>"
