// src/components/EligibilityScore/BiomarkerMatch.jsx
// Shows which biomarkers matched the trial

import React from "react";

export default function BiomarkerMatch({ patientBiomarkers = [], trialKeywords = [] }) {
    if (!patientBiomarkers.length) return null;

    // Check which patient biomarkers appear in trial keywords
    const matched = patientBiomarkers.filter(b =>
        trialKeywords.some(k =>
            k.toLowerCase().includes(b.toLowerCase()) ||
            b.toLowerCase().includes(k.toLowerCase())
        )
    );

    const unmatched = patientBiomarkers.filter(b => !matched.includes(b));

    return (
        <div style={{ marginTop: 12 }}>
            <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
            }}>
                🔬 Biomarker Analysis
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {matched.map((b, i) => (
                    <span key={i} style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "#ECFDF5",
                        color: "#059669",
                        border: "1px solid #A7F3D0",
                    }}>
                        ✅ {b}
                    </span>
                ))}
                {unmatched.map((b, i) => (
                    <span key={i} style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "#F8FAFF",
                        color: "#94A3B8",
                        border: "1px solid #E2E8F0",
                    }}>
                        ○ {b}
                    </span>
                ))}
            </div>
        </div>
    );
}