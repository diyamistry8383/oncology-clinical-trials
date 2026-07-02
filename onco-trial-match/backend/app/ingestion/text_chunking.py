"""
Splits raw eligibility criteria text (as published on ClinicalTrials.gov,
typically formatted with "Inclusion Criteria:" / "Exclusion Criteria:"
headers and bullet-like lines) into clean chunks suitable for embedding.

This is intentionally simple line/length-based chunking for Step 2. The
structured inclusion/exclusion extraction (NLP eligibility parser) lands
in Step 3 and supersedes this for anything needing field-level structure —
this module exists purely to prep clean text for the embedding step.
"""
from __future__ import annotations

import re

_MAX_CHUNK_CHARS = 1000


def _clean_line(line: str) -> str:
    """Strip leading bullet markers, asterisks, extra whitespace."""
    line = line.strip()
    line = re.sub(r"^[\-\*\u2022]\s*", "", line)
    return line


def chunk_eligibility_text(raw_text: str, max_chunk_chars: int = _MAX_CHUNK_CHARS) -> list[str]:
    """
    Break eligibility criteria text into chunks, splitting first on
    blank lines / section headers, then packing consecutive lines together
    up to max_chunk_chars so embeddings aren't built from a single giant blob.

    Returns an empty list if raw_text is empty/whitespace only.
    """
    if not raw_text or not raw_text.strip():
        return []

    lines = [_clean_line(l) for l in raw_text.splitlines()]
    lines = [l for l in lines if l]  # drop empty lines

    # A single line longer than max_chunk_chars would otherwise produce an
    # oversized chunk (the length guard below only fires when `current` is
    # non-empty), so pre-split any such line into max_chunk_chars-sized
    # pieces before the main packing pass.
    split_lines: list[str] = []
    for line in lines:
        if len(line) <= max_chunk_chars:
            split_lines.append(line)
        else:
            for i in range(0, len(line), max_chunk_chars):
                split_lines.append(line[i : i + max_chunk_chars])
    lines = split_lines

    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for line in lines:
        # Section headers (e.g. "Inclusion Criteria:") start a new chunk
        # so each chunk stays topically coherent.
        is_header = line.lower().rstrip(":").endswith(("criteria", "inclusion criteria", "exclusion criteria"))

        if is_header and current:
            chunks.append(" ".join(current))
            current, current_len = [], 0

        if current_len + len(line) > max_chunk_chars and current:
            chunks.append(" ".join(current))
            current, current_len = [], 0

        current.append(line)
        current_len += len(line) + 1

    if current:
        chunks.append(" ".join(current))

    return chunks
