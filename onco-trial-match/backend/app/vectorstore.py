"""
Thin wrapper around a ChromaDB HTTP client used for storing and querying
trial-eligibility embeddings (and, at query time, ad-hoc patient-profile
embeddings) for semantic similarity search.
"""
from __future__ import annotations

from typing import Any

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import get_settings

settings = get_settings()

_client: chromadb.HttpClient | None = None


def get_chroma_client() -> chromadb.HttpClient:
    """Lazily create a singleton ChromaDB HTTP client pointed at the chromadb service."""
    global _client
    if _client is None:
        _client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client


def get_trials_collection():
    """Get (or create) the collection that stores trial eligibility-criteria embeddings."""
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=settings.CHROMA_COLLECTION_TRIALS,
        metadata={"hnsw:space": "cosine"},
    )


def delete_trials_collection() -> None:
    """
    Delete the trials collection entirely. Needed when switching embedding
    models/dimensions (e.g. Step 2's placeholder 384-dim vectors -> Step 4's
    real 768-dim BioBERT vectors) — ChromaDB collections are dimension-locked
    to whatever was first inserted, so mixed dimensions in one collection
    will error or behave unpredictably. Call this once before re-running
    ingestion after an embedding-model change.
    """
    client = get_chroma_client()
    try:
        client.delete_collection(name=settings.CHROMA_COLLECTION_TRIALS)
    except Exception:
        # Collection may not exist yet — fine, get_or_create_collection
        # will make a fresh one on next use.
        pass


def upsert_trial_embedding(
    trial_id: str,
    embedding: list[float],
    document_text: str,
    metadata: dict[str, Any],
) -> None:
    """Insert or update a single trial's eligibility-criteria embedding."""
    collection = get_trials_collection()
    collection.upsert(
        ids=[trial_id],
        embeddings=[embedding],
        documents=[document_text],
        metadatas=[metadata],
    )


def query_similar_trials(
    query_embedding: list[float],
    top_k: int = 5,
    where: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run a similarity search against stored trial embeddings."""
    collection = get_trials_collection()
    return collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where,
    )
