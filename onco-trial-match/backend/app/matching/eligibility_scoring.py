"""
Engine for calculating patient-trial eligibility and recommendation scores.
Integrates vector similarity with structured rule checking (age, sex, biomarkers, prior treatments).
"""
from __future__ import annotations

import logging
from app.models.patient import Patient
from app.models.trial import Trial

logger = logging.getLogger("eligibility_scoring")


def calculate_match_score(patient: Patient, trial: Trial, similarity_score: float) -> dict:
    """
    Calculate a composite eligibility match percentage (0-100) and recommendation score.
    Returns:
        dict with keys:
            - score: int (0 to 100)
            - age_eligible: bool
            - sex_eligible: bool
            - biomarker_match_status: str ("match", "mismatch", "neutral")
            - reasons: list[str]
            - factors: list[dict]
    """
    reasons = []
    factors = []
    
    # 1. Base Score from semantic/vector similarity (worth up to 40 points)
    base_points = round(similarity_score * 40)
    factors.append({"name": "Semantic Relevance", "points": base_points, "max": 40})
    score = base_points
    
    # 2. Age Eligibility Check (worth 15 points)
    # Check if patient age is within trial age limits
    age_eligible = True
    min_age = None
    max_age = None
    
    # Parse minimum age
    if trial.minimum_age:
        try:
            min_age = int(trial.minimum_age.split()[0])
        except (ValueError, IndexError):
            pass
            
    # Parse maximum age
    if trial.maximum_age:
        try:
            max_age = int(trial.maximum_age.split()[0])
        except (ValueError, IndexError):
            pass
            
    if min_age is not None and patient.age < min_age:
        age_eligible = False
        reasons.append(f"Age {patient.age} is below trial minimum age {min_age}")
    elif max_age is not None and patient.age > max_age:
        age_eligible = False
        reasons.append(f"Age {patient.age} exceeds trial maximum age {max_age}")
        
    if age_eligible:
        score += 15
        factors.append({"name": "Age Compatibility", "points": 15, "max": 15})
    else:
        # Hard constraint violation
        score = max(0, score - 30)
        factors.append({"name": "Age Mismatch", "points": -30, "max": 15})

    # 3. Sex Eligibility Check (worth 10 points)
    sex_eligible = True
    trial_sex = trial.sex.upper() if trial.sex else "ALL"
    patient_sex = patient.sex.upper() if patient.sex else "ALL"
    
    if trial_sex != "ALL" and patient_sex != "ALL" and trial_sex != patient_sex:
        sex_eligible = False
        reasons.append(f"Trial is for {trial.sex} but patient is {patient.sex}")
        
    if sex_eligible:
        score += 10
        factors.append({"name": "Sex Compatibility", "points": 10, "max": 10})
    else:
        score = max(0, score - 30)
        factors.append({"name": "Sex Mismatch", "points": -30, "max": 10})

    # 4. Biomarker Matching Check (worth up to 20 points)
    biomarker_points = 0
    biomarker_status = "neutral"
    
    trial_structured = trial.eligibility_structured or {}
    trial_biomarkers = [b.lower() for b in trial_structured.get("biomarkers", [])]
    patient_biomarkers = [b.lower() for b in patient.biomarkers]
    
    matched_markers = []
    excluded_markers_matched = []
    
    # Analyze biomarkers (EGFR, HER2, KRAS, BRAF, ALK, PD-L1)
    if trial_biomarkers:
        # Check exclusion criteria specifically for biomarkers
        exclusions = [c.lower() for c in trial_structured.get("exclusion", [])]
        for pm in patient.biomarkers:
            pm_low = pm.lower()
            # Simple check: does the patient biomarker appear in exclusion?
            for excl in exclusions:
                if pm_low in excl or (("positive" in pm_low or "+" in pm_low) and pm_low.split()[0] in excl and "no" in excl):
                    excluded_markers_matched.append(pm)
                    
        # Check inclusions
        inclusions = [c.lower() for c in trial_structured.get("inclusion", [])]
        for pm in patient.biomarkers:
            pm_low = pm.lower()
            short_name = pm_low.replace("+", "").replace("-", "").strip()
            # Match short name like egfr or specific biomarker strings
            for tb in trial_biomarkers:
                if short_name in tb or tb in pm_low:
                    matched_markers.append(pm)
                    
        if excluded_markers_matched:
            biomarker_status = "mismatch"
            biomarker_points = -15
            reasons.append(f"Excluded biomarkers found in patient profile: {', '.join(excluded_markers_matched)}")
        elif matched_markers:
            biomarker_status = "match"
            biomarker_points = 20
            reasons.append(f"Patient biomarkers match trial requirements: {', '.join(matched_markers)}")
        else:
            biomarker_status = "neutral"
            biomarker_points = 10  # neutral / no conflict
            
        score += biomarker_points
        factors.append({"name": "Biomarker Match", "points": biomarker_points, "max": 20})
    else:
        # Trial does not mention biomarkers - neutral
        score += 15
        factors.append({"name": "Biomarker (Not Required)", "points": 15, "max": 20})

    # 5. Prior Treatments Check (worth up to 15 points)
    treatment_points = 10
    trial_treatments = [t.lower() for t in trial_structured.get("prior_treatment", [])]
    patient_treatments = [t.lower() for t in patient.prior_treatments]
    
    if trial_treatments and patient_treatments:
        exclusions = [c.lower() for c in trial_structured.get("exclusion", [])]
        excl_matched = []
        for pt in patient.prior_treatments:
            pt_low = pt.lower()
            for excl in exclusions:
                if pt_low in excl and ("no prior" in excl or "without prior" in excl or "exclusion" in excl or "must not" in excl):
                    excl_matched.append(pt)
                    
        if excl_matched:
            treatment_points = -10
            reasons.append(f"Excluded prior treatments found in patient history: {', '.join(excl_matched)}")
        else:
            # Check positive prior therapy matches
            inclusions = [c.lower() for c in trial_structured.get("inclusion", [])]
            inc_matched = []
            for pt in patient.prior_treatments:
                pt_low = pt.lower()
                for incl in inclusions:
                    if pt_low in incl and ("prior" in incl or "treated with" in incl or "therapy" in incl):
                        inc_matched.append(pt)
            if inc_matched:
                treatment_points = 15
                reasons.append(f"Patient treatment history aligns with trial inclusions: {', '.join(inc_matched)}")
            else:
                treatment_points = 10
                
        score += treatment_points
        factors.append({"name": "Prior Treatment Alignment", "points": treatment_points, "max": 15})
    else:
        # Neutral if trial doesn't specify or patient has no treatments
        score += 12
        factors.append({"name": "Prior Treatment (Neutral)", "points": 12, "max": 15})

    # Ensure score is capped within 0-100
    final_score = max(0, min(100, score))
    
    # If hard constraints (age/sex) are completely failed, cap score at 30%
    if not age_eligible or not sex_eligible:
        final_score = min(30, final_score)
        
    return {
        "score": final_score,
        "age_eligible": age_eligible,
        "sex_eligible": sex_eligible,
        "biomarker_status": biomarker_status,
        "reasons": reasons,
        "factors": factors
    }
