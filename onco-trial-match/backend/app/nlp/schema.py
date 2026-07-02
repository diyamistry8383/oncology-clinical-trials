"""
Structured output shape for the eligibility parser. This is the contract
between app.nlp.eligibility_parser and everything downstream (Trial model's
eligibility_structured column, the matching layer in Step 4-5).
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class AgeRange(BaseModel):
    minimum_age: int | None = None
    maximum_age: int | None = None


class ParsedEligibility(BaseModel):
    """
    Structured criteria extracted from a trial's raw eligibility text.

    inclusion / exclusion: individual criterion statements, lightly cleaned
        but otherwise kept close to the source wording (downstream matching
        does its own semantic comparison — over-normalizing here would lose
        clinically meaningful detail).
    age_range: parsed numeric bounds, used for simple eligibility pre-filtering
        before semantic search runs.
    biomarkers: biomarker/mutation mentions pulled from inclusion/exclusion
        text (e.g. "EGFR mutation positive", "PD-L1 >= 50%").
    prior_treatment: prior-therapy requirements or exclusions mentioned in
        the criteria (e.g. "no more than 2 prior lines of chemotherapy").
    parse_method: "rule_based" if regex/heuristics alone produced this,
        "llm_assisted" if the LLM fallback was used for ambiguous clauses.
        Downstream consumers can use this to weight confidence.
    """

    inclusion: list[str] = Field(default_factory=list)
    exclusion: list[str] = Field(default_factory=list)
    age_range: AgeRange = Field(default_factory=AgeRange)
    biomarkers: list[str] = Field(default_factory=list)
    prior_treatment: list[str] = Field(default_factory=list)
    parse_method: str = "rule_based"
