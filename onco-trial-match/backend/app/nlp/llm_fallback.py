"""
LLM-assisted extraction for eligibility text where rule-based parsing
(field_extractors.py) found little or nothing — e.g. trials that describe
biomarker/age/treatment-history requirements in unusual phrasing the regex
patterns don't cover.

This is a fallback, not the primary path: rule-based extraction runs first
in eligibility_parser.py, and the LLM is only invoked when its output looks
sparse, to keep cost and latency down across a full ingestion batch.
"""
from __future__ import annotations

import json
import logging

from anthropic import AsyncAnthropic

from app.config import get_settings
from app.nlp.schema import AgeRange, ParsedEligibility

logger = logging.getLogger("eligibility_llm_fallback")

settings = get_settings()

_SYSTEM_PROMPT = """You are extracting structured eligibility data from oncology \
clinical trial criteria text. You will be given inclusion and exclusion \
criteria text. Extract only what is explicitly stated — do not infer or \
guess values that aren't in the text.

Respond with ONLY a JSON object, no preamble, no markdown fences, in this \
exact shape:
{
  "age_range": {"minimum_age": <int or null>, "maximum_age": <int or null>},
  "biomarkers": ["<biomarker mention>", ...],
  "prior_treatment": ["<prior treatment clause>", ...]
}

If a field has no information in the text, use an empty list or null. \
Keep biomarker and prior_treatment entries close to the original wording."""


async def llm_extract_fields(inclusion_text: str, exclusion_text: str) -> dict:
    """
    Calls the configured LLM to extract age_range/biomarkers/prior_treatment
    from raw criteria text. Returns a dict matching that subset of
    ParsedEligibility's shape. Raises on API failure — caller decides how
    to handle (eligibility_parser.py catches and falls back to rule-based
    results only, rather than failing the whole trial).
    """
    if not settings.ANTHROPIC_API_KEY:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set — LLM fallback unavailable. "
            "Set it in backend/.env to enable LLM-assisted parsing."
        )

    client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    user_content = (
        f"Inclusion Criteria:\n{inclusion_text or '(none provided)'}\n\n"
        f"Exclusion Criteria:\n{exclusion_text or '(none provided)'}"
    )

    response = await client.messages.create(
        model=settings.LLM_MODEL,
        max_tokens=1000,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    text_block = next((b.text for b in response.content if b.type == "text"), "")
    cleaned = text_block.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("LLM fallback returned non-JSON output, ignoring: %r", text_block[:200])
        return {}

    return parsed


def merge_llm_fields_into(parsed: ParsedEligibility, llm_fields: dict) -> ParsedEligibility:
    """
    Merge LLM-extracted fields into an existing ParsedEligibility, only
    filling in gaps the rule-based pass left empty — the rule-based result
    is trusted over the LLM's wherever it already found something, since
    regex matches on explicit ClinicalTrials.gov structured fields (like
    minimumAge) are more reliable than free-text LLM inference.
    """
    if not parsed.age_range.minimum_age and not parsed.age_range.maximum_age:
        llm_age = llm_fields.get("age_range") or {}
        parsed.age_range = AgeRange(
            minimum_age=llm_age.get("minimum_age"),
            maximum_age=llm_age.get("maximum_age"),
        )

    if not parsed.biomarkers:
        parsed.biomarkers = llm_fields.get("biomarkers", []) or []

    if not parsed.prior_treatment:
        parsed.prior_treatment = llm_fields.get("prior_treatment", []) or []

    parsed.parse_method = "llm_assisted"
    return parsed
