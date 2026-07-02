"""
Generates a structured, human-readable eligibility summary for a single
patient-trial match, using the LLM to reason over the patient's clinical
profile against the trial's parsed eligibility criteria.

Features:
- AI Eligibility Scoring: Match percentage (0-100)
- Explainable AI: Reasons for eligibility / ineligibility
- AI Risk Prediction: Risk level (Low/Medium/High) and reasons
- Prior treatment / biomarker matching analysis
- Graceful rule-based fallback when LLM is unavailable or fails
"""
from __future__ import annotations

import json
import logging

from anthropic import AsyncAnthropic

from app.config import get_settings
from app.embeddings.patient_embedder import build_patient_profile_text
from app.models.patient import Patient
from app.models.trial import Trial
from app.schemas.match import LLMEligibilitySummary

logger = logging.getLogger("llm_eligibility_summary")
settings = get_settings()

_SYSTEM_PROMPT = """You are assisting an oncologist by summarizing how well a \
patient's clinical profile aligns with a clinical trial's eligibility \
criteria. You are NOT making an enrollment decision — the oncologist makes \
that decision. Your job is to help them review quickly by surfacing what \
matches and what doesn't.

Base your assessment ONLY on the information given. Do not assume missing \
information is favorable or unfavorable — if something needed to assess a \
criterion isn't in the patient profile, list it as a concern/open question \
rather than guessing.

Provide an eligibility match percentage (0 to 100) and perform a participation \
risk assessment (Low, Medium, High) with detailed clinical risk explanations \
based on the patient's performance status (ECOG), disease severity, comorbidities, and treatment history.

Respond with ONLY a JSON object, no preamble, no markdown fences, in this \
exact shape:
{
  "likely_eligible": <true|false>,
  "match_percentage": <0 to 100 as integer>,
  "risk_level": "<Low|Medium|High>",
  "risk_reasons": ["<reason 1>", ...],
  "reasons_eligible": ["<positive clinical reason patient fits>", ...],
  "reasons_ineligible": ["<clinical reason/concern patient does not fit or needs review>", ...],
  "matched_criteria": ["<criterion the patient appears to satisfy>", ...],
  "concerns": ["<criterion that conflicts, or needs more info to assess>", ...],
  "summary_text": "<2-4 sentence plain-language summary for the oncologist>"
}

"likely_eligible" should be true only if you see no clear disqualifying \
exclusion criteria AND the core inclusion criteria (diagnosis, age, key \
biomarkers) appear satisfied based on the given profile. Set it false if \
there's a clear conflict, even if other criteria match well."""


def _build_user_prompt(patient: Patient, trial: Trial) -> str:
    patient_text = build_patient_profile_text(patient)

    structured = trial.eligibility_structured or {}
    inclusion = structured.get("inclusion", [])
    exclusion = structured.get("exclusion", [])
    age_range = structured.get("age_range", {})
    biomarkers = structured.get("biomarkers", [])
    prior_treatment = structured.get("prior_treatment", [])

    criteria_block = (
        f"Trial: {trial.title} ({trial.nct_id})\n\n"
        f"Inclusion criteria:\n"
        + ("\n".join(f"- {c}" for c in inclusion) if inclusion else "(none extracted)")
        + "\n\nExclusion criteria:\n"
        + ("\n".join(f"- {c}" for c in exclusion) if exclusion else "(none extracted)")
        + f"\n\nAge range: {age_range.get('minimum_age', 'N/A')} to {age_range.get('maximum_age', 'N/A')}"
        + f"\nBiomarkers mentioned in criteria: {', '.join(biomarkers) if biomarkers else '(none extracted)'}"
        + f"\nPrior treatment requirements: {', '.join(prior_treatment) if prior_treatment else '(none extracted)'}"
    )

    return f"Patient profile:\n{patient_text}\n\n{criteria_block}"


async def generate_eligibility_summary(
    patient: Patient, trial: Trial, similarity_score: float = 0.5
) -> LLMEligibilitySummary:
    """
    Calls the LLM to produce a structured eligibility summary for one
    patient-trial pair. Falls back gracefully to rule-based evaluation if the
    API key is missing or calls fail.
    """
    has_valid_key = (
        settings.ANTHROPIC_API_KEY 
        and not settings.ANTHROPIC_API_KEY.startswith("sk-ant-your-key")
        and settings.ANTHROPIC_API_KEY != "your-key-here"
    )

    if not has_valid_key:
        logger.info("Using rule-based fallback matching for trial %s", trial.nct_id)
        return _generate_fallback_summary(patient, trial, similarity_score)

    try:
        client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        user_prompt = _build_user_prompt(patient, trial)

        response = await client.messages.create(
            model=settings.LLM_MODEL,
            max_tokens=1000,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )

        text_block = next((b.text for b in response.content if b.type == "text"), "")
        cleaned = text_block.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()

        parsed = json.loads(cleaned)

        return LLMEligibilitySummary(
            likely_eligible=bool(parsed.get("likely_eligible", False)),
            match_percentage=int(parsed.get("match_percentage", round(similarity_score * 100))),
            risk_level=parsed.get("risk_level", "Low"),
            risk_reasons=parsed.get("risk_reasons", []) or [],
            reasons_eligible=parsed.get("reasons_eligible", []) or [],
            reasons_ineligible=parsed.get("reasons_ineligible", []) or [],
            matched_criteria=parsed.get("matched_criteria", []) or [],
            concerns=parsed.get("concerns", []) or [],
            summary_text=parsed.get("summary_text", ""),
        )

    except Exception as exc:
        logger.warning(
            "Failed to call LLM or parse LLM output for trial %s — falling back to rule-based summary",
            trial.nct_id,
            exc_info=True,
        )
        return _generate_fallback_summary(patient, trial, similarity_score, failed_api=True)


def _generate_fallback_summary(
    patient: Patient, trial: Trial, similarity_score: float, failed_api: bool = False
) -> LLMEligibilitySummary:
    """Computes a structured fallback summary based on eligibility_scoring."""
    from app.matching.eligibility_scoring import calculate_match_score
    score_info = calculate_match_score(patient, trial, similarity_score)
    
    likely_eligible = (
        score_info["age_eligible"] 
        and score_info["sex_eligible"] 
        and score_info["biomarker_status"] != "mismatch"
    )
    
    # Simple risk prediction logic
    risk_level = "Low"
    risk_reasons = []
    if patient.ecog_status is not None and patient.ecog_status >= 2:
        risk_level = "High"
        risk_reasons.append(f"Elevated risk: Patient has a poor ECOG performance status of {patient.ecog_status}")
    
    if score_info["biomarker_status"] == "mismatch":
        risk_level = "High"
        risk_reasons.append("Significant risk: Patient biomarkers conflict with trial exclusion criteria")
        
    if len(patient.comorbidities) > 1:
        if risk_level != "High":
            risk_level = "Medium"
        risk_reasons.append(f"Moderate risk: Patient has multiple comorbidities: {', '.join(patient.comorbidities)}")
        
    if not risk_reasons:
        risk_reasons.append("Standard risk: Patient meets initial age, sex, and biomarker requirements.")
        
    reasons_eligible = []
    reasons_ineligible = []
    
    for r in score_info["reasons"]:
        if "below" in r or "exceeds" in r or "mismatch" in r or "conflict" in r or "excluded" in r:
            reasons_ineligible.append(r)
        else:
            reasons_eligible.append(r)
            
    if not reasons_eligible:
        reasons_eligible.append("Patient primary diagnosis is semantically relevant to the trial's target conditions.")
    if score_info["age_eligible"]:
        reasons_eligible.append("Patient age meets the trial criteria.")
    if score_info["sex_eligible"]:
        reasons_eligible.append("Patient sex is compatible with the trial cohort.")
        
    suffix = " (API call failed, fallback used)" if failed_api else " (No API key, fallback used)"
    summary_text = (
        f"Rule-based matching evaluation{suffix}. Eligibility match percentage is {score_info['score']}%. "
        f"Patient age is {patient.age} (limits: {trial.minimum_age or 'None'} to {trial.maximum_age or 'None'}). "
        f"Active patient biomarkers: {', '.join(patient.biomarkers) if patient.biomarkers else 'None'}."
    )
    
    # Extract some parsed list elements to show as matched/concerns
    structured = trial.eligibility_structured or {}
    matched_criteria = structured.get("inclusion", [])[:3]
    
    return LLMEligibilitySummary(
        likely_eligible=likely_eligible,
        match_percentage=score_info["score"],
        risk_level=risk_level,
        risk_reasons=risk_reasons,
        reasons_eligible=reasons_eligible,
        reasons_ineligible=reasons_ineligible,
        matched_criteria=matched_criteria,
        concerns=reasons_ineligible,
        summary_text=summary_text
    )