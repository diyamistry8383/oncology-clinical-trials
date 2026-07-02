import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PatientBase(BaseModel):
    display_name: str
    age: int = Field(ge=0, le=120)
    sex: str
    primary_diagnosis: str
    cancer_type: str
    stage: str | None = None
    ecog_status: int | None = Field(default=None, ge=0, le=5)
    biomarkers: list[str] = []
    prior_treatments: list[str] = []
    comorbidities: list[str] = []
    clinical_summary: str | None = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    display_name: str | None = None
    age: int | None = None
    sex: str | None = None
    primary_diagnosis: str | None = None
    cancer_type: str | None = None
    stage: str | None = None
    ecog_status: int | None = None
    biomarkers: list[str] | None = None
    prior_treatments: list[str] | None = None
    comorbidities: list[str] | None = None
    clinical_summary: str | None = None


class PatientRead(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source: str
    created_at: datetime
