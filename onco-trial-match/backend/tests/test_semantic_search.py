"""
Tests for app.matching.semantic_search. The distance-conversion test is a
pure function and runs anywhere. The find_matching_trials test mocks both
the embedder and ChromaDB query so it doesn't require a running model or
database — it verifies the result-parsing logic (mapping ChromaDB's batched
response shape into TrialMatchCandidate objects) is correct.
"""
from unittest.mock import AsyncMock, patch

import pytest

from app.matching.semantic_search import _distance_to_similarity, find_matching_trials


def test_distance_to_similarity_identical():
    assert _distance_to_similarity(0.0) == 1.0


def test_distance_to_similarity_maximally_dissimilar():
    assert _distance_to_similarity(2.0) == 0.0


def test_distance_to_similarity_midpoint():
    assert _distance_to_similarity(1.0) == 0.5


def test_distance_to_similarity_clamps_negative():
    # Distances shouldn't exceed 2 in cosine space, but stay non-negative
    # defensively if they ever do.
    assert _distance_to_similarity(3.0) == 0.0


@pytest.mark.asyncio
async def test_find_matching_trials_parses_chroma_results():
    fake_chroma_response = {
        "ids": [["vec-1", "vec-2"]],
        "distances": [[0.2, 0.8]],
        "documents": [["Inclusion: age >= 18", "Inclusion: EGFR positive"]],
        "metadatas": [[{"nct_id": "NCT00000001"}, {"nct_id": "NCT00000002"}]],
    }

    with patch(
        "app.matching.semantic_search.embed_patient_profile", new=AsyncMock(return_value=[0.1] * 768)
    ), patch(
        "app.matching.semantic_search.query_similar_trials", return_value=fake_chroma_response
    ):
        fake_patient = object()  # embed_patient_profile is mocked, so its input doesn't matter here
        results = await find_matching_trials(fake_patient, top_k=2)

    assert len(results) == 2
    assert results[0].nct_id == "NCT00000001"
    assert results[0].similarity_score == 0.9  # 1 - 0.2/2
    assert results[1].nct_id == "NCT00000002"
    assert results[1].similarity_score == 0.6  # 1 - 0.8/2


@pytest.mark.asyncio
async def test_find_matching_trials_skips_entries_without_nct_id():
    fake_chroma_response = {
        "ids": [["vec-1", "vec-2"]],
        "distances": [[0.2, 0.5]],
        "documents": [["doc1", "doc2"]],
        "metadatas": [[{"nct_id": "NCT00000001"}, {}]],  # second entry missing nct_id
    }

    with patch(
        "app.matching.semantic_search.embed_patient_profile", new=AsyncMock(return_value=[0.1] * 768)
    ), patch(
        "app.matching.semantic_search.query_similar_trials", return_value=fake_chroma_response
    ):
        results = await find_matching_trials(object(), top_k=2)

    assert len(results) == 1
    assert results[0].nct_id == "NCT00000001"
