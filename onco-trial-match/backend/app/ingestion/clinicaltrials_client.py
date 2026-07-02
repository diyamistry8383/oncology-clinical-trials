"""
Thin async client for the ClinicalTrials.gov API v2 (free, no API key required).

Docs: https://clinicaltrials.gov/data-api/api

We page through studies matching a condition + recruiting status, requesting
only the fields we need to keep payloads small.
"""
from __future__ import annotations

from typing import Any

import httpx

from app.config import get_settings

settings = get_settings()

# Fields we actually use downstream (full field list is much larger).
# See: https://clinicaltrials.gov/data-api/about-api/study-data-structure
_FIELDS = [
    "NCTId",
    "BriefTitle",
    "BriefSummary",
    "OverallStatus",
    "Phase",
    "Condition",
    "EligibilityCriteria",
    "MinimumAge",
    "MaximumAge",
    "Sex",
    "LocationFacility",
    "LocationCity",
    "LocationState",
    "LocationCountry",
]


class ClinicalTrialsClient:
    def __init__(self, base_url: str | None = None, timeout: float = 30.0):
        self.base_url = base_url or settings.CLINICALTRIALS_API_BASE
        self._client = httpx.AsyncClient(base_url=self.base_url, timeout=timeout)

    async def close(self) -> None:
        await self._client.aclose()

    async def fetch_recruiting_trials(
        self,
        condition: str = "cancer",
        max_trials: int = 200,
        page_size: int = 100,
    ) -> list[dict[str, Any]]:
        """
        Fetch recruiting trials matching `condition`, paging until either
        max_trials is reached or the API runs out of results.

        Returns a list of raw study dicts (already unwrapped from the
        `studies[].protocolSection` envelope) ready for the normalizer.
        """
        results: list[dict[str, Any]] = []
        page_token: str | None = None

        while len(results) < max_trials:
            params = {
                "query.cond": condition,
                "filter.overallStatus": "RECRUITING",
                "fields": ",".join(_FIELDS),
                "pageSize": min(page_size, max_trials - len(results)),
            }
            if page_token:
                params["pageToken"] = page_token

            response = await self._client.get("/studies", params=params)
            response.raise_for_status()
            payload = response.json()

            studies = payload.get("studies", [])
            if not studies:
                break

            results.extend(studies)
            page_token = payload.get("nextPageToken")
            if not page_token:
                break

        return results[:max_trials]
