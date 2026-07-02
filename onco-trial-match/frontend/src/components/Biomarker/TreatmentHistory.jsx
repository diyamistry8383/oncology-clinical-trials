// src/components/Biomarker/TreatmentHistory.jsx
// Shows prior treatment history with conflict detection

import React from "react";
import { TREATMENT_TYPES } from "../../data/biomarkers";

export default function TreatmentHistory({ treatments = [], trialText = "" }) {
    if (!treatments.length) return null;

    const detectType = (treatment) => {
        const t = treatment.toLowerCase();
        if (t.includes("chemo") || t.includes("carboplatin") ||
            t.includes("cisplatin") || t.includes("paclitaxel") ||
            t.includes("docetaxel") || t.includes("gemcitabine"))
            return TREATMENT_TYPES.find(x => x.id === "chemotherapy");
        if (t.includes("immuno") || t.includes("pembrolizumab") ||
            t.includes("nivolumab") || t.includes("atezolizumab"))
            return TREATMENT_TYPES.find(x => x.id === "immunotherapy");
        if (t.includes("radiation") || t.includes("radio") || t.includes("xrt"))
            return TREATMENT_TYPES.find(x => x.id === "radiation");
        if (t.includes("surgery") || t.includes("resection") || t.includes("mastectomy"))
            return TREATMENT_TYPES.find(x => x.id === "surgery");
        if (t.includes("targeted") || t.includes("erlotinib") ||
            t.includes("gefitinib") || t.includes("trastuzumab") ||
            t.includes("imatinib"))
            return TREATMENT_TYPES.find(x => x.id === "targeted");
        if (t.includes("hormone") || t.includes("tamoxifen") ||
            t.includes("letrozole") || t.includes("anastrozole"))
            return TREATMENT_TYPES.find(x => x.id === "hormone");
        return null;
    };

    // Check if treatment conflicts with trial
    const hasConflict = (treatment) => {
        if (!trialText) return false;
        const lower = trialText.toLowerCase();
        const t = treatment.toLowerCase();
        return (
            lower.includes(`prior ${t}`) ||
            lower.includes(`previous ${t}`) ||
            lower.includes(`no prior ${t}`) ||
            lower.includes(`${t} naive`)
        );
    };

    return (
        <div style={{ marginTop: 14 }}>
            <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
            }}>
                💊 Treatment History
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {treatments.map((t, i) => {
                    const type = detectType(t);
                    const conflict = hasConflict(t);

                    return (
                        <div key={i} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                            background: conflict ? "#FEF2F2" : (type ? `${type.color}11` : "#F1F5F9"),
                            color: conflict ? "#DC2626" : (type ? type.color : "#64748B"),
                            border: `1px solid ${conflict ? "#FECACA" : (type ? `${type.color}33` : "#E2E8F0")}`,
                        }}>
                            <span>{conflict ? "⚠️" : (type ? type.icon : "💊")}</span>
                            {t}
                            {conflict && (
                                <span style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    marginLeft: 2,
                                    color: "#DC2626",
                                }}>
                                    CONFLICT
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}