"""
Tests for app.embeddings.patient_embedder.build_patient_profile_text.
Requires the full app package importable (pydantic etc.) since Patient is
a SQLAlchemy model — run with pytest once dependencies are installed.
"""
from app.embeddings.patient_embedder import build_patient_profile_text
from app.models.patient import Patient


def test_build_patient_profile_text_minimal_fields():
    patient = Patient(
        display_name="Test Patient",
        age=62,
        sex="FEMALE",
        primary_diagnosis="Stage III NSCLC",
        cancer_type="Lung Cancer",
    )
    text = build_patient_profile_text(patient)

    assert "62-year-old female patient." in text
    assert "Stage III NSCLC" in text
    assert "Lung Cancer" in text


def test_build_patient_profile_text_full_fields():
    patient = Patient(
        display_name="Test Patient",
        age=55,
        sex="MALE",
        primary_diagnosis="Metastatic colorectal cancer",
        cancer_type="Colorectal Cancer",
        stage="IV",
        ecog_status=1,
        biomarkers=["KRAS G12C", "MSI-H"],
        prior_treatments=["FOLFOX", "Bevacizumab"],
        comorbidities=["Type 2 diabetes"],
        clinical_summary="Patient has progressive disease on second-line therapy.",
    )
    text = build_patient_profile_text(patient)

    assert "Stage: IV." in text
    assert "ECOG performance status: 1." in text
    assert "KRAS G12C, MSI-H" in text
    assert "FOLFOX, Bevacizumab" in text
    assert "Type 2 diabetes" in text
    assert "progressive disease" in text


def test_build_patient_profile_text_omits_empty_optional_fields():
    patient = Patient(
        display_name="Test Patient",
        age=40,
        sex="FEMALE",
        primary_diagnosis="Breast cancer",
        cancer_type="Breast Cancer",
    )
    text = build_patient_profile_text(patient)

    assert "Stage:" not in text
    assert "ECOG" not in text
    assert "Biomarkers:" not in text
