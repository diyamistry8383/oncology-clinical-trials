"""
Regex-based extractors that pull structured fields (age range, biomarkers,
prior treatment mentions) out of criterion line lists.

These are heuristics tuned for common oncology trial phrasing — they will
miss unusual wording, which is exactly what the LLM fallback in
app.nlp.llm_fallback exists to catch for clauses these patterns don't match.
"""
from __future__ import annotations

import re

from app.nlp.schema import AgeRange

# --- Age extraction ---------------------------------------------------

_AGE_AT_LEAST_RE = re.compile(r"(?:age[d]?\s*)?(?:>=|at least|≥)\s*(\d{1,3})\s*years?", re.IGNORECASE)
_AGE_AT_MOST_RE = re.compile(r"(?:age[d]?\s*)?(?:<=|at most|≤|or younger|or less)\s*(\d{1,3})\s*years?", re.IGNORECASE)
_AGE_RANGE_RE = re.compile(r"(?:age[d]?\s*)?(\d{1,3})\s*(?:to|-|–)\s*(\d{1,3})\s*years?", re.IGNORECASE)
_AGE_EXACT_PHRASE_RE = re.compile(r"(\d{1,3})\s*years?\s*(?:of age)?\s*(?:or older|and older)", re.IGNORECASE)


def extract_age_range(min_age_field: str | None, max_age_field: str | None, criterion_lines: list[str]) -> AgeRange:
    """
    Prefer the structured minimumAge/maximumAge fields already supplied by
    ClinicalTrials.gov (parsed in Step 2's normalizer) when present, since
    those are far more reliable than free-text inference. Fall back to
    scanning inclusion criterion text only if those fields are missing.
    """
    min_age = _parse_ct_gov_age_field(min_age_field)
    max_age = _parse_ct_gov_age_field(max_age_field)

    if min_age is not None or max_age is not None:
        return AgeRange(minimum_age=min_age, maximum_age=max_age)

    # Fallback: scan criterion text for common age phrasing.
    for line in criterion_lines:
        range_match = _AGE_RANGE_RE.search(line)
        if range_match:
            lo, hi = int(range_match.group(1)), int(range_match.group(2))
            return AgeRange(minimum_age=min(lo, hi), maximum_age=max(lo, hi))

        at_least_match = _AGE_AT_LEAST_RE.search(line) or _AGE_EXACT_PHRASE_RE.search(line)
        at_most_match = _AGE_AT_MOST_RE.search(line)
        if at_least_match or at_most_match:
            return AgeRange(
                minimum_age=int(at_least_match.group(1)) if at_least_match else None,
                maximum_age=int(at_most_match.group(1)) if at_most_match else None,
            )

    return AgeRange()


def _parse_ct_gov_age_field(value: str | None) -> int | None:
    """ClinicalTrials.gov age fields look like '18 Years' or 'N/A'."""
    if not value:
        return None
    match = re.search(r"(\d+)", value)
    return int(match.group(1)) if match else None


# --- Biomarker extraction ---------------------------------------------

# Common oncology biomarker/mutation patterns. Intentionally not exhaustive —
# this list covers the markers that show up across the majority of solid
# tumor trials; expand as new trial types are ingested.
_BIOMARKER_PATTERNS = [
    r"EGFR(?:\s+mutation)?(?:\s*[-+]|\s*positive|\s*negative)?",
    r"ALK(?:\s+rearrangement|\s+fusion)?(?:\s*[-+]|\s*positive|\s*negative)?",
    r"ROS1(?:\s+fusion)?(?:\s*[-+]|\s*positive|\s*negative)?",
    r"KRAS(?:\s*G12C)?(?:\s+mutation)?",
    r"BRAF(?:\s*V600E)?(?:\s+mutation)?",
    r"HER2(?:\s*[-+]|\s*positive|\s*negative|\s*low|\s*amplified)?",
    r"PD-?L1(?:\s*(?:expression\s*)?(?:>=|≥|<=|≤)?\s*\d{1,3}\s*%)?",
    r"BRCA1\/?2?(?:\s+mutation)?",
    r"MSI-?H(?:igh)?",
    r"TMB-?H(?:igh)?",
    r"ER(?:\s*[-+]|\s*positive|\s*negative)",
    r"PR(?:\s*[-+]|\s*positive|\s*negative)",
]
_BIOMARKER_RE = re.compile("|".join(f"(?:{p})" for p in _BIOMARKER_PATTERNS), re.IGNORECASE)


def extract_biomarkers(criterion_lines: list[str]) -> list[str]:
    """Pull biomarker/mutation mentions out of criterion text, deduplicated."""
    found: list[str] = []
    for line in criterion_lines:
        for match in _BIOMARKER_RE.finditer(line):
            text = match.group(0).strip()
            if text and text not in found:
                found.append(text)
    return found


# --- Prior treatment extraction ----------------------------------------

_PRIOR_TREATMENT_KEYWORDS = (
    "prior treatment",
    "prior therapy",
    "prior chemotherapy",
    "prior radiation",
    "prior surgery",
    "prior immunotherapy",
    "previously treated",
    "previous treatment",
    "lines of therapy",
    "line of treatment",
    "treatment-naive",
    "treatment naive",
)


def extract_prior_treatment(criterion_lines: list[str]) -> list[str]:
    """
    Return criterion lines that mention prior-treatment history/requirements.
    Returns whole matching lines (not sub-spans) since prior-treatment
    clauses are usually compound statements that lose meaning if truncated.
    """
    matches: list[str] = []
    for line in criterion_lines:
        lowered = line.lower()
        if any(keyword in lowered for keyword in _PRIOR_TREATMENT_KEYWORDS):
            if line not in matches:
                matches.append(line)
    return matches
