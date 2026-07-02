"""
Main entrypoint for the eligibility NLP parser: takes raw eligibility
criteria text (plus the structured minimumAge/maximumAge fields already
available from ClinicalTrials.gov) and produces a ParsedEligibility.

Pipeline:
1. Split raw text into inclusion / exclusion blocks (section_splitter)
2. Break each block into individual criterion lines
3. Run rule-based extractors for age / biomarkers / prior treatment
4. If rule-based extraction came back sparse, call the LLM fallback to
   fill gaps (only triggered when needed, to control cost across a batch)
"""
from __future__ import annotations

import logging

from app.nlp.field_extractors import extract_age_range, extract_biomarkers, extract_prior_treatment
from app.nlp.llm_fallback import llm_extract_fields, merge_llm_fields_into
from app.nlp.schema import ParsedEligibility
from app.nlp.section_splitter import extract_criterion_lines, split_inclusion_exclusion

logger = logging.getLogger("eligibility_parser")


def _is_sparse(parsed: ParsedEligibility) -> bool:
    """
    Heuristic for whether the rule-based pass found "enough" — if it got
    no age info AND no biomarkers AND no prior-treatment mentions, the
    trial likely phrases these in a way our regex patterns don't cover,
    so it's worth spending an LLM call to try harder.
    """
    has_age = parsed.age_range.minimum_age is not None or parsed.age_range.maximum_age is not None
    return not has_age and not parsed.biomarkers and not parsed.prior_treatment


async def parse_eligibility_criteria(
    raw_text: str | None,
    minimum_age_field: str | None = None,
    maximum_age_field: str | None = None,
    use_llm_fallback: bool = True,
) -> ParsedEligibility:
    """
    Parse raw eligibility criteria text into structured fields.

    Args:
        raw_text: the eligibility_criteria_raw text from a Trial record.
        minimum_age_field / maximum_age_field: the structured age fields
            ClinicalTrials.gov already provides (Trial.minimum_age / .maximum_age),
            preferred over text inference when present.
        use_llm_fallback: set False to force rule-based-only parsing (e.g.
            in tests, or batch runs where LLM cost should be avoided entirely).

    Returns a ParsedEligibility — never raises on malformed input; worst
    case is an all-empty result with parse_method="rule_based".
    """
    if not raw_text or not raw_text.strip():
        return ParsedEligibility()

    inclusion_block, exclusion_block = split_inclusion_exclusion(raw_text)
    inclusion_lines = extract_criterion_lines(inclusion_block)
    exclusion_lines = extract_criterion_lines(exclusion_block)
    all_lines = inclusion_lines + exclusion_lines

    parsed = ParsedEligibility(
        inclusion=inclusion_lines,
        exclusion=exclusion_lines,
        age_range=extract_age_range(minimum_age_field, maximum_age_field, all_lines),
        biomarkers=extract_biomarkers(all_lines),
        prior_treatment=extract_prior_treatment(all_lines),
        parse_method="rule_based",
    )

    if use_llm_fallback and _is_sparse(parsed):
        try:
            llm_fields = await llm_extract_fields(inclusion_block, exclusion_block)
            if llm_fields:
                parsed = merge_llm_fields_into(parsed, llm_fields)
        except Exception:
            # LLM fallback is best-effort — a missing API key or transient
            # API error should not break ingestion for the whole trial.
            logger.warning("LLM fallback failed, keeping rule-based result only", exc_info=True)

    return parsed
