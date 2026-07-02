// src/services/clinicalTrialsAPI.js
// Fetches real data from ClinicalTrials.gov API v2 (free, no key needed)

const BASE = "https://clinicaltrials.gov/api/v2/studies";

export async function fetchTrialsByCancer(keywords, filters = {}) {
    const { status = "RECRUITING", phase = "", pageSize = 15, pageToken = null } = filters;

    const query = keywords.slice(0, 3).join(" OR ");

    const params = new URLSearchParams({
        "query.cond": query,
        "filter.overallStatus": status,
        pageSize: String(pageSize),
        format: "json",
        fields: [
            "NCTId", "BriefTitle", "OverallStatus", "Phase",
            "BriefSummary", "Condition", "InterventionName",
            "EligibilityCriteria", "MinimumAge", "MaximumAge",
            "LocationCity", "LocationCountry", "LocationFacility",
            "StartDate", "CompletionDate", "EnrollmentCount",
            "LeadSponsorName",
        ].join(","),
    });

    if (phase) params.append("filter.phase", phase);
    if (pageToken) params.append("pageToken", pageToken);

    const res = await fetch(`${BASE}?${params}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();

    return {
        trials: (data.studies || []).map(normalizeStudy),
        nextPageToken: data.nextPageToken || null,
        total: data.totalCount || 0,
    };
}

// Flatten the nested API response into a simple object
function normalizeStudy(study) {
    const p = study?.protocolSection || {};
    const id = p?.identificationModule || {};
    const st = p?.statusModule || {};
    const de = p?.designModule || {};
    const ds = p?.descriptionModule || {};
    const el = p?.eligibilityModule || {};
    const cl = p?.contactsLocationsModule || {};
    const sp = p?.sponsorCollaboratorsModule || {};
    const ai = p?.armsInterventionsModule || {};

    return {
        nctId: id.nctId || "",
        title: id.briefTitle || "Untitled",
        status: st.overallStatus || "Unknown",
        phase: (de.phases || []).join(", ") || "N/A",
        summary: ds.briefSummary || "",
        conditions: p?.conditionsModule?.conditions || [],
        interventions: (ai.interventions || []).map(i => i.interventionName).join(", "),
        eligibility: el.eligibilityCriteria || "",
        minAge: el.minimumAge || "N/A",
        maxAge: el.maximumAge || "N/A",
        gender: el.sex || "All",
        locations: (cl.locations || []).map(l => `${l.city || ""}, ${l.country || ""}`),
        sponsor: sp?.leadSponsor?.name || "Unknown",
        startDate: st.startDateStruct?.date || "N/A",
        enrollment: de.enrollmentInfo?.count || null,
        url: `https://clinicaltrials.gov/study/${id.nctId}`,
    };
}