"""
Tests for app.matching.llm_summary._build_user_prompt — the pure text
formatting logic that assembles patient + trial data into the LLM prompt.
Does not call the actual Anthropic API (no network/key required).
"""
from app.matching.llm_summary import _build_user_prompt
from app.models.patient import Patient
from app.models.trial import Trial


def _make_patient(**overrides) -> Patient:
    defaults = dict(
        display_name="Test Patient",
        age=62,
        sex="FEMALE",
        primary_diagnosis="Stage III Non-Small Cell Lung Cancer",
        cancer_type="Lung Cancer",
        stage="III",
        ecog_status=1,
        biomarkers=["EGFR mutation positive"],
        prior_treatments=["Carboplatin", "Pemetrexed"],
    )
    defaults.update(overrides)
    return Patient(**defaults)


def _make_trial(**overrides) -> Trial:
    defaults = dict(
        nct_id="NCT00000001",
        title="Test Trial for EGFR-mutant NSCLC",
        status="RECRUITING",
        eligibility_structured={
            "inclusion": ["Age >= 18 years", "EGFR mutation positive tumor"],
            "exclusion": ["Prior treatment with osimertinib"],
            "age_range": {"minimum_age": 18, "maximum_age": None},
            "biomarkers": ["EGFR mutation positive"],
            "prior_treatment": ["Prior treatment with osimertinib"],
        },
    )
    defaults.update(overrides)
    return Trial(**defaults)


def test_build_user_prompt_includes_patient_and_trial_info():
    patient = _make_patient()
    trial = _make_trial()

    prompt = _build_user_prompt(patient, trial)

    assert "Stage III Non-Small Cell Lung Cancer" in prompt
    assert "EGFR mutation positive" in prompt
    assert trial.nct_id in prompt
    assert trial.title in prompt
    assert "Age >= 18 years" in prompt
    assert "Prior treatment with osimertinib" in prompt


def test_build_user_prompt_handles_missing_structured_data():
    patient = _make_patient()
    trial = _make_trial(eligibility_structured=None)

    prompt = _build_user_prompt(patient, trial)

    # Should not raise, and should clearly indicate missing data rather
    # than silently omitting the section.
    assert "(none extracted)" in prompt
    assert trial.nct_id in prompt


def test_build_user_prompt_handles_partial_structured_data():
    patient = _make_patient()
    trial = _make_trial(
        eligibility_structured={
            "inclusion": ["Age >= 18 years"],
            "exclusion": [],
            "age_range": {},
            "biomarkers": [],
            "prior_treatment": [],
        }
    )

    prompt = _build_user_prompt(patient, trial)

    assert "Age >= 18 years" in prompt
    assert "(none extracted)" in prompt  # for exclusion/biomarkers/prior_treatment