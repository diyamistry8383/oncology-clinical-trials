"""
Smoke test for Step 1: confirms the FastAPI app boots and /health responds.
Requires postgres + chromadb to be reachable (run via docker-compose, or
point .env at local instances) since lifespan startup calls init_db().
"""
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
