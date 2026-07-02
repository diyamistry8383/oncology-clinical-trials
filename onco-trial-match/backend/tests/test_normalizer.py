"""
Unit tests for app.ingestion.normalizer — pure functions, no network or DB
required, so these run fast and don't need docker-compose up.
"""
from app.ingestion.normalizer import normalize_study, normalize_studies

SAMPLE_RAW_STUDY = {
    "protocolSection": {
        "identificationModule": {
            "nctId": "NCT05123456",
            "briefTitle": "A Study of Drug X in Stage III NSCLC",
        },
        "statusModule": {"overallStatus": "RECRUITING"},
        "descriptionModule": {"briefSummary": "Testing drug X in advanced lung cancer."},
        "designModule": {"phases": ["PHASE2"]},
        "conditionsModule": {"conditions": ["Non-Small Cell Lung Cancer"]},
        "eligibilityModule": {
            "eligibilityCriteria": (
                "Inclusion Criteria:\n- Age >= 18\n- ECOG 0-1\n\n"
                "Exclusion Criteria:\n- Prior treatment with Drug X\n"
            ),
            "minimumAge": "18 Years",
            "maximumAge": "N/A",
            "sex": "ALL",
        },
        "contactsLocationsModule": {
            "locations": [
                {
                    "facility": "City Cancer Center",
                    "city": "Boston",
                    "state": "Massachusetts",
                    "country": "United States",
                }
            ]
        },
    }
}


def test_normalize_study_maps_core_fields():
    normalized = normalize_study(SAMPLE_RAW_STUDY)

    assert normalized["nct_id"] == "NCT05123456"
    assert normalized["title"] == "A Study of Drug X in Stage III NSCLC"
    assert normalized["status"] == "RECRUITING"
    assert normalized["phase"] == "PHASE2"
    assert normalized["conditions"] == ["Non-Small Cell Lung Cancer"]
    assert normalized["minimum_age"] == "18 Years"
    assert normalized["sex"] == "ALL"
    assert "Inclusion Criteria" in normalized["eligibility_criteria_raw"]


def test_normalize_study_maps_locations():
    normalized = normalize_study(SAMPLE_RAW_STUDY)

    assert len(normalized["locations"]) == 1
    assert normalized["locations"][0]["city"] == "Boston"


def test_normalize_study_handles_missing_fields_gracefully():
    sparse = {"protocolSection": {"identificationModule": {"nctId": "NCT00000001"}}}
    normalized = normalize_study(sparse)

    assert normalized["nct_id"] == "NCT00000001"
    assert normalized["title"] == ""
    assert normalized["brief_summary"] is None
    assert normalized["conditions"] == []
    assert normalized["locations"] == []


def test_normalize_studies_drops_records_without_nct_id():
    studies = [SAMPLE_RAW_STUDY, {"protocolSection": {"identificationModule": {}}}]
    normalized = normalize_studies(studies)

    assert len(normalized) == 1
    assert normalized[0]["nct_id"] == "NCT05123456"
