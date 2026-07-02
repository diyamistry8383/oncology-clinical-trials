from app.nlp.section_splitter import extract_criterion_lines, split_inclusion_exclusion


def test_split_inclusion_exclusion_basic():
    text = (
        "Inclusion Criteria:\n"
        "- Age >= 18 years\n"
        "- Histologically confirmed NSCLC\n\n"
        "Exclusion Criteria:\n"
        "- Prior chemotherapy\n"
        "- Active CNS metastases\n"
    )
    inclusion, exclusion = split_inclusion_exclusion(text)

    assert "Age >= 18 years" in inclusion
    assert "Histologically confirmed NSCLC" in inclusion
    assert "Exclusion Criteria" not in inclusion

    assert "Prior chemotherapy" in exclusion
    assert "Active CNS metastases" in exclusion
    assert "Inclusion Criteria" not in exclusion


def test_split_inclusion_exclusion_no_exclusion_header():
    text = "Inclusion Criteria:\n- Age >= 18\n- ECOG 0-1"
    inclusion, exclusion = split_inclusion_exclusion(text)

    assert "Age >= 18" in inclusion
    assert exclusion == ""


def test_split_inclusion_exclusion_empty_text():
    assert split_inclusion_exclusion("") == ("", "")
    assert split_inclusion_exclusion("   ") == ("", "")


def test_split_inclusion_exclusion_key_inclusion_variant():
    text = "Key Inclusion Criteria:\n- Must be 18+\n\nKey Exclusion Criteria:\n- No prior surgery"
    inclusion, exclusion = split_inclusion_exclusion(text)

    assert "Must be 18+" in inclusion
    assert "No prior surgery" in exclusion


def test_extract_criterion_lines_bulleted():
    block = "- Age >= 18 years\n- ECOG 0-1\n* Histologically confirmed cancer"
    lines = extract_criterion_lines(block)

    assert len(lines) == 3
    assert lines[0] == "Age >= 18 years"
    assert lines[1] == "ECOG 0-1"
    assert lines[2] == "Histologically confirmed cancer"


def test_extract_criterion_lines_numbered():
    block = "1. Age >= 18 years\n2. ECOG performance status 0-1\n3. Adequate organ function"
    lines = extract_criterion_lines(block)

    assert len(lines) == 3
    assert lines[0] == "Age >= 18 years"


def test_extract_criterion_lines_no_bullets_falls_back_to_sentences():
    block = "Patients must be at least 18 years old. Patients must have measurable disease."
    lines = extract_criterion_lines(block)

    assert len(lines) == 2
    assert "18 years old" in lines[0]
    assert "measurable disease" in lines[1]


def test_extract_criterion_lines_empty():
    assert extract_criterion_lines("") == []
    assert extract_criterion_lines("   ") == []
