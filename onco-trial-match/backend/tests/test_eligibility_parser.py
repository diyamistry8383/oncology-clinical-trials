"""
Tests for the main eligibility_parser orchestrator. These require pydantic
and the rest of the app package to be importable (pip install -r
requirements.txt), since ParsedEligibility is a Pydantic model.

Run with: pytest tests/test_eligibility_parser.py
"""
import pytest

from app.nlp.eligibility_parser import parse_eligibility_criteria


@pytest.mark.asyncio
async def test_parse_eligibility_criteria_empty_text():
    result = await parse_eligibility_criteria(None)
    assert result.inclusion == []
    assert result.exclusion == []
    assert result.age_range.minimum_age is None


@pytest.mark.asyncio
async def test_parse_eligibility_criteria_rule_based_only():
    raw_text = (
        "Inclusion Criteria:\n"
        "- Age >= 18 years\n"
        "- EGFR mutation positive tumor\n\n"
        "Exclusion Criteria:\n"
        "- No prior chemotherapy for metastatic disease\n"
        "- Active CNS metastases\n"
    )
    result = await parse_eligibility_criteria(
        raw_text, minimum_age_field="18 Years", maximum_age_field="N/A", use_llm_fallback=False
    )

    assert result.parse_method == "rule_based"
    assert result.age_range.minimum_age == 18
    assert result.age_range.maximum_age is None
    assert any("EGFR" in b for b in result.biomarkers)
    assert any("chemotherapy" in p.lower() for p in result.prior_treatment)
    assert len(result.inclusion) == 2
    assert len(result.exclusion) == 2


@pytest.mark.asyncio
async def test_parse_eligibility_criteria_disables_llm_fallback_when_requested():
    """Even sparse criteria text shouldn't trigger an LLM call when use_llm_fallback=False."""
    raw_text = "Inclusion Criteria:\nPatients must be ambulatory and provide consent."
    result = await parse_eligibility_criteria(raw_text, use_llm_fallback=False)

    # No age/biomarker/prior-treatment signal in this text — should stay
    # rule_based (empty) rather than attempting an LLM call.
    assert result.parse_method == "rule_based"
    assert result.biomarkers == []
    assert result.prior_treatment == []
