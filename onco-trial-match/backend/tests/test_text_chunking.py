from app.ingestion.text_chunking import chunk_eligibility_text


def test_chunk_eligibility_text_empty_returns_empty_list():
    assert chunk_eligibility_text("") == []
    assert chunk_eligibility_text("   \n  ") == []


def test_chunk_eligibility_text_splits_on_section_headers():
    text = (
        "Inclusion Criteria:\n"
        "- Age >= 18 years\n"
        "- Histologically confirmed NSCLC\n\n"
        "Exclusion Criteria:\n"
        "- Prior chemotherapy\n"
        "- Active CNS metastases\n"
    )
    chunks = chunk_eligibility_text(text)

    assert len(chunks) == 2
    assert "Inclusion Criteria" in chunks[0]
    assert "Age >= 18 years" in chunks[0]
    assert "Exclusion Criteria" in chunks[1]
    assert "Prior chemotherapy" in chunks[1]


def test_chunk_eligibility_text_strips_bullet_markers():
    text = "Inclusion Criteria:\n* Age >= 18\n\u2022 ECOG 0-1\n- No prior surgery"
    chunks = chunk_eligibility_text(text)

    combined = " ".join(chunks)
    assert "* Age" not in combined
    assert "\u2022 ECOG" not in combined
    assert "Age >= 18" in combined


def test_chunk_eligibility_text_respects_max_chunk_length():
    long_line = "Patients must have adequate organ function. " * 30
    text = f"Inclusion Criteria:\n{long_line}\n{long_line}\n{long_line}"

    chunks = chunk_eligibility_text(text, max_chunk_chars=200)

    assert len(chunks) > 1
    assert all(len(c) <= 250 for c in chunks)  # small buffer for join spacing
