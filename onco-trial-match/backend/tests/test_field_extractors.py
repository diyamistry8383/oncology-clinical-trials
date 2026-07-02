from app.nlp.field_extractors import extract_age_range, extract_biomarkers, extract_prior_treatment


# --- Age range -----------------------------------------------------

def test_extract_age_range_prefers_structured_fields():
    age_range = extract_age_range("18 Years", "75 Years", [])
    assert age_range.minimum_age == 18
    assert age_range.maximum_age == 75


def test_extract_age_range_handles_na_maximum():
    age_range = extract_age_range("18 Years", "N/A", [])
    assert age_range.minimum_age == 18
    assert age_range.maximum_age is None


def test_extract_age_range_falls_back_to_text_when_fields_missing():
    lines = ["Patients aged 18 to 65 years are eligible"]
    age_range = extract_age_range(None, None, lines)
    assert age_range.minimum_age == 18
    assert age_range.maximum_age == 65


def test_extract_age_range_at_least_phrasing():
    lines = ["Age >= 18 years at time of consent"]
    age_range = extract_age_range(None, None, lines)
    assert age_range.minimum_age == 18
    assert age_range.maximum_age is None


def test_extract_age_range_no_match_returns_empty():
    age_range = extract_age_range(None, None, ["No age information here"])
    assert age_range.minimum_age is None
    assert age_range.maximum_age is None


# --- Biomarkers ------------------------------------------------------

def test_extract_biomarkers_finds_known_markers():
    lines = [
        "Patients must have EGFR mutation positive tumors",
        "PD-L1 expression >= 50%",
        "No BRAF V600E mutation",
    ]
    biomarkers = extract_biomarkers(lines)
    assert any("EGFR" in b for b in biomarkers)
    assert any("PD-L1" in b for b in biomarkers)
    assert any("BRAF" in b for b in biomarkers)


def test_extract_biomarkers_deduplicates():
    lines = ["EGFR mutation positive", "EGFR mutation positive again mentioned"]
    biomarkers = extract_biomarkers(lines)
    # Same matched text shouldn't appear twice
    assert len(biomarkers) == len(set(biomarkers))


def test_extract_biomarkers_no_markers_returns_empty():
    assert extract_biomarkers(["Patients must be ambulatory"]) == []


# --- Prior treatment --------------------------------------------------

def test_extract_prior_treatment_finds_matching_lines():
    lines = [
        "No prior chemotherapy for metastatic disease",
        "Patients must be ambulatory",
        "Treatment-naive patients only",
    ]
    result = extract_prior_treatment(lines)
    assert "No prior chemotherapy for metastatic disease" in result
    assert "Treatment-naive patients only" in result
    assert "Patients must be ambulatory" not in result


def test_extract_prior_treatment_no_matches_returns_empty():
    assert extract_prior_treatment(["Patients must be ambulatory"]) == []


def test_extract_prior_treatment_deduplicates_identical_lines():
    lines = ["No prior chemotherapy", "No prior chemotherapy"]
    result = extract_prior_treatment(lines)
    assert result == ["No prior chemotherapy"]
