// src/components/Biomarker/BiomarkerPanel.jsx
// Full biomarker panel for patient profile

import React from "react";
import BiomarkerCard from "./BiomarkerCard";
import { BIOMARKERS } from "../../data/biomarkers";

export default function BiomarkerPanel({ patientBiomarkers = [], trialText = "" }) {
    if (!patientBiomarkers.length) return null;

    // Check which patient biomarkers are mentioned in trial text
    const isMatched = (name) => {
        if (!trialText) return false;
        const lower = trialText.toLowerCase();
        const info = BIOMARKERS.find(b =>
            b.id.toLowerCase() === name.toLowerCase() ||
            name.toLowerCase().includes(b.id.toLowerCase())
        );
        if (!info) return lower.includes(name.toLowerCase());
        return (
            lower.includes(info.id.toLowerCase()) ||
            lower.includes(info.fullName.toLowerCase())
        );
    };

    const matched = patientBiomarkers.filter(b => isMatched(b));
    const unmatched = patientBiomarkers.filter(b => !isMatched(b));

    return (
        <div style={{ marginTop: 14 }}>
            <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
            }}>
                🔬 Biomarker Analysis
                {matched.length > 0 && (
                    <span style={{
                        fontSize: 10,
                        padding: "1px 8px",
                        borderRadius: 20,
                        background: "#ECFDF5",
                        color: "#059669",
                        fontWeight: 700,
                    }}>
                        {matched.length} matched
                    </span>
                )}
            </div>

            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "flex-start",
            }}>
                {/* Matched biomarkers first */}
                {matched.map((b, i) => (
                    <BiomarkerCard key={`m-${i}`} name={b} matched={true} />
                ))}
                {/* Unmatched biomarkers */}
                {unmatched.map((b, i) => (
                    <BiomarkerCard key={`u-${i}`} name={b} matched={false} />
                ))}
            </div>

            {/* Suggestion if no matches */}
            {matched.length === 0 && patientBiomarkers.length > 0 && (
                <div style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    background: "#FFFBEB",
                    borderRadius: 8,
                    border: "1px solid #FDE68A",
                    fontSize: 12,
                    color: "#92400E",
                    display: "flex",
                    gap: 6,
                }}>
                    💡 None of the patient's biomarkers directly matched
                    this trial's criteria. Consider reviewing eligibility manually.
                </div>
            )}
        </div>
    );
}