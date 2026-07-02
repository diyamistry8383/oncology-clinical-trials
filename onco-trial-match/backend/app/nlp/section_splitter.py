"""
Splits raw eligibility criteria text into an inclusion block and an
exclusion block, then breaks each block into individual criterion lines.

ClinicalTrials.gov eligibility text is free-form prose written by trial
staff, not a fixed format — section headers vary ("Inclusion Criteria:",
"Key Inclusion Criteria", "Patients must meet the following:") and bullet
styles vary (-, *, numbered, or none at all). This module handles the
common patterns; anything it can't confidently split falls into inclusion
by default, since most criteria documents lead with inclusion content.
"""
from __future__ import annotations

import re

_INCLUSION_HEADER_RE = re.compile(
    r"(key\s+)?inclusion\s+criteria\s*:?",
    re.IGNORECASE,
)
_EXCLUSION_HEADER_RE = re.compile(
    r"(key\s+)?exclusion\s+criteria\s*:?",
    re.IGNORECASE,
)

_BULLET_RE = re.compile(r"^[\-\*\u2022]\s*|^\d+[\.\)]\s*")


def split_inclusion_exclusion(raw_text: str) -> tuple[str, str]:
    """
    Returns (inclusion_block, exclusion_block) as raw text spans.
    If no exclusion header is found, exclusion_block is empty and the
    entire text is treated as inclusion.
    """
    if not raw_text or not raw_text.strip():
        return "", ""

    inc_match = _INCLUSION_HEADER_RE.search(raw_text)
    exc_match = _EXCLUSION_HEADER_RE.search(raw_text)

    if not exc_match:
        # No recognizable exclusion header — whole thing is inclusion content,
        # starting after the inclusion header if one was found.
        start = inc_match.end() if inc_match else 0
        return raw_text[start:].strip(), ""

    if inc_match and inc_match.start() < exc_match.start():
        inclusion_block = raw_text[inc_match.end() : exc_match.start()]
    else:
        # Exclusion header found but no inclusion header before it —
        # treat everything before the exclusion header as inclusion content.
        inclusion_block = raw_text[: exc_match.start()]

    exclusion_block = raw_text[exc_match.end() :]

    return inclusion_block.strip(), exclusion_block.strip()


def extract_criterion_lines(block: str) -> list[str]:
    """
    Break a single inclusion or exclusion block into individual criterion
    statements — one per bullet/numbered line, or one per sentence if the
    block has no bullet structure at all.
    """
    if not block or not block.strip():
        return []

    raw_lines = [l.strip() for l in block.splitlines() if l.strip()]

    # If most lines look bulleted/numbered, treat each line as one criterion.
    bulleted_count = sum(1 for l in raw_lines if _BULLET_RE.match(l))
    if raw_lines and bulleted_count >= max(1, len(raw_lines) // 2):
        criteria = [_BULLET_RE.sub("", l).strip() for l in raw_lines]
        return [c for c in criteria if c]

    # Fallback: no clear bullet structure — split on sentence boundaries.
    joined = " ".join(raw_lines)
    sentences = re.split(r"(?<=[.;])\s+", joined)
    return [s.strip() for s in sentences if s.strip()]
