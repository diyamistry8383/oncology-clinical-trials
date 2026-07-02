"""
Builds a clinical-profile text summary from a Patient record and embeds it
using the same biomedical embedder used for trial eligibility text, so the
two vectors live in the same embedding space for cosine similarity search.
"""
from __future__ import annotations

import asyncio

from app.embeddings.biobert_embedder import embed_text
from app.models.patient import Patient


def build_patient_profile_text(patient: Patient) -> str:
    """
    Compose a single text block describing the patient's clinical profile,
    in roughly the same register as trial eligibility criteria (age,
    diagnosis, stage, biomarkers, prior treatment) so the embedding model
    sees comparable phrasing on both sides of the match.

    Prefers patient.clinical_summary if present (e.g. a free-text note from
    an EHR), since that's likely to contain more nuance than the structured
    fields alone — but always includes the structured fields too, since a
    clinical_summary may omit details the structured fields capture.
    """
    parts: list[str] = []

    parts.append(f"{patient.age}-year-old {patient.sex.lower()} patient.")
    parts.append(f"Primary diagnosis: {patient.primary_diagnosis} ({patient.cancer_type}).")

    if patient.stage:
        parts.append(f"Stage: {patient.stage}.")
    if patient.ecog_status is not None:
        parts.append(f"ECOG performance status: {patient.ecog_status}.")
    if patient.biomarkers:
        parts.append(f"Biomarkers: {', '.join(patient.biomarkers)}.")
    if patient.prior_treatments:
        parts.append(f"Prior treatments: {', '.join(patient.prior_treatments)}.")
    if patient.comorbidities:
        parts.append(f"Comorbidities: {', '.join(patient.comorbidities)}.")
    if patient.clinical_summary:
        parts.append(patient.clinical_summary)

    return " ".join(parts)


async def embed_patient_profile(patient: Patient) -> list[float]:
    """
    Build the patient's profile text and embed it. Runs the (blocking)
    model call in a thread executor so it doesn't block the event loop,
    matching how trial embeddings are produced during ingestion.
    """
    profile_text = build_patient_profile_text(patient)
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, embed_text, profile_text)
