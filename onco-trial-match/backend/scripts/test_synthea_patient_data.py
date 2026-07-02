"""
Data integrity tests for the Synthea-style synthetic patient seed data.
Pure data validation — no DB or network required.
"""
from scripts.synthea_patient_data import SYNTHETIC_ONCOLOGY_PATIENTS

REQUIRED_FIELDS = {
    "display_name",
    "age",
    "sex",
    "primary_diagnosis",
    "cancer_type",
    "stage",
    "ecog_status",
    "biomarkers",
    "prior_treatments",
    "comorbidities",
    "clinical_summary",
}


def test_seed_data_has_multiple_patients():
    assert len(SYNTHETIC_ONCOLOGY_PATIENTS) >= 10


def test_seed_data_display_names_are_unique():
    names = [p["display_name"] for p in SYNTHETIC_ONCOLOGY_PATIENTS]
    assert len(names) == len(set(names))


def test_seed_data_covers_multiple_cancer_types():
    cancer_types = {p["cancer_type"] for p in SYNTHETIC_ONCOLOGY_PATIENTS}
    assert len(cancer_types) >= 5


def test_seed_data_every_record_has_required_fields():
    for patient in SYNTHETIC_ONCOLOGY_PATIENTS:
        assert REQUIRED_FIELDS.issubset(patient.keys()), f"Missing fields in {patient.get('display_name')}"


def test_seed_data_field_types_and_ranges_are_valid():
    for patient in SYNTHETIC_ONCOLOGY_PATIENTS:
        assert isinstance(patient["age"], int)
        assert 0 < patient["age"] < 120
        assert patient["sex"] in ("MALE", "FEMALE", "ALL")
        assert isinstance(patient["biomarkers"], list)
        assert isinstance(patient["prior_treatments"], list)
        assert isinstance(patient["comorbidities"], list)
        if patient["ecog_status"] is not None:
            assert 0 <= patient["ecog_status"] <= 5
        if patient["stage"] is not None:
            assert isinstance(patient["stage"], str)