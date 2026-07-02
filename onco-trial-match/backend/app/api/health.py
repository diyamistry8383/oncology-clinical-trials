"""
Basic health/readiness endpoints used by docker-compose healthchecks and
for a quick manual sanity check that the API is up.
"""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}


@router.get("/")
async def root() -> dict:
    return {
        "service": "Onco Trial Match API",
        "docs": "/docs",
        "health": "/health",
    }
