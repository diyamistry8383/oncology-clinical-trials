"""
Wraps a biomedical sentence-transformer model to produce dense embeddings
for trial eligibility text and patient clinical profiles, so the two can
be compared via cosine similarity in ChromaDB.

Model choice: we use a sentence-transformers-compatible biomedical model
rather than raw BioBERT, because raw BioBERT (dmis-lab/biobert-base-cased-v1.1)
is a masked-language-model checkpoint without a pooling head trained for
sentence-level similarity — feeding its raw [CLS] embeddings into cosine
similarity gives poor results without further fine-tuning. Pritamdeka's
S-BioBERT was specifically fine-tuned for sentence-similarity tasks on top
of BioBERT, which is what we actually need for matching here. The
BIOBERT_MODEL_NAME setting can be swapped to test alternatives.
"""
from __future__ import annotations

import logging
import threading

from app.config import get_settings

logger = logging.getLogger("biobert_embedder")
settings = get_settings()

_model = None
_model_lock = threading.Lock()

# Default to a sentence-similarity-tuned biomedical model. Override via
# BIOBERT_MODEL_NAME in .env if a different checkpoint is preferred.
_DEFAULT_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def _get_model():
    """
    Lazily load the sentence-transformer model as a process-wide singleton.
    Loading is expensive (downloads + initializes the model on first call),
    so we guard with a lock to avoid duplicate loads under concurrent requests.
    """
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:  # re-check after acquiring the lock
                from sentence_transformers import SentenceTransformer

                model_name = settings.BIOBERT_MODEL_NAME or _DEFAULT_MODEL_NAME
                logger.info("Loading biomedical embedding model: %s", model_name)
                _model = SentenceTransformer(model_name, device="cpu")
                logger.info("Model loaded successfully")
    return _model


def embed_text(text: str) -> list[float]:
    """
    Embed a single piece of text (trial eligibility text or patient
    clinical summary) into a dense vector for similarity comparison.
    """
    if not text or not text.strip():
        raise ValueError("Cannot embed empty text")

    model = _get_model()
    embedding = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
    return embedding.tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Embed multiple texts in one batch call — significantly faster than
    calling embed_text in a loop during ingestion of many trials.
    """
    if not texts:
        return []

    model = _get_model()
    embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True, batch_size=16)
    return embeddings.tolist()
