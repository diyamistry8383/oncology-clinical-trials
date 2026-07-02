"""
Converts a raw ClinicalTrials.gov v2 study record (nested under
protocolSection.*Module) into the flat dict shape expected by
app.schemas.trial.TrialCreate / the Trial ORM model.

The API's nesting is verbose and inconsistent across modules, so this is
intentionally defensive — missing fields become None/empty rather than
raising, since trial data quality varies a lot across the registry.
"""
from __future__ import annotations

from typing import Any


def _get(d: dict, *path: str, default: Any = None) -> Any:
    """Safely walk a nested dict by a sequence of keys."""
    cur: Any = d
    for key in path:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(key)
        if cur is None:
            return default
    return cur


def normalize_study(raw_study: dict) -> dict:
    """
    Map one raw study record from ClinicalTrials.gov API v2 to the flat
    dict shape used by TrialCreate.

    Expected raw shape (abbreviated):
    {
      "protocolSection": {
        "identificationModule": {"nctId": ..., "briefTitle": ...},
        "statusModule": {"overallStatus": ...},
        "descriptionModule": {"briefSummary": ...},
        "designModule": {"phases": [...]},
        "conditionsModule": {"conditions": [...]},
        "eligibilityModule": {
            "eligibilityCriteria": ..., "minimumAge": ..., "maximumAge": ..., "sex": ...
        },
        "contactsLocationsModule": {"locations": [{"facility":..., "city":..., "state":..., "country":...}]}
      }
    }
    """
    protocol = raw_study.get("protocolSection", {})

    nct_id = _get(protocol, "identificationModule", "nctId")
    title = _get(protocol, "identificationModule", "briefTitle", default="")
    brief_summary = _get(protocol, "descriptionModule", "briefSummary")
    status = _get(protocol, "statusModule", "overallStatus", default="UNKNOWN")

    phases = _get(protocol, "designModule", "phases", default=[])
    phase = ", ".join(phases) if phases else None

    conditions = _get(protocol, "conditionsModule", "conditions", default=[])

    eligibility = _get(protocol, "eligibilityModule", default={})
    eligibility_criteria_raw = eligibility.get("eligibilityCriteria")
    minimum_age = eligibility.get("minimumAge")
    maximum_age = eligibility.get("maximumAge")
    sex = eligibility.get("sex")

    raw_locations = _get(protocol, "contactsLocationsModule", "locations", default=[])
    locations = [
        {
            "facility": loc.get("facility"),
            "city": loc.get("city"),
            "state": loc.get("state"),
            "country": loc.get("country"),
        }
        for loc in raw_locations
    ]

    return {
        "nct_id": nct_id,
        "title": title,
        "brief_summary": brief_summary,
        "status": status,
        "phase": phase,
        "conditions": conditions,
        "locations": locations,
        "eligibility_criteria_raw": eligibility_criteria_raw,
        "minimum_age": minimum_age,
        "maximum_age": maximum_age,
        "sex": sex,
    }


def normalize_studies(raw_studies: list[dict]) -> list[dict]:
    """Normalize a batch, dropping any record missing a usable NCT ID."""
    normalized = [normalize_study(s) for s in raw_studies]
    return [n for n in normalized if n.get("nct_id")]
