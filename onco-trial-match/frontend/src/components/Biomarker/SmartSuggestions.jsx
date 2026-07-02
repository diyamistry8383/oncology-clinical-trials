// src/components/Biomarker/SmartSuggestions.jsx
// AI suggestions for missing tests and alternative trials

import React, { useState } from "react";
import { BIOMARKERS } from "../../data/biomarkers";

export default function SmartSuggestions({ patientBiomarkers = [], cancerType = "" }) {
    const [visible, setVisible] = useState(false);

    // Suggest biomarkers commonly tested for this cancer type
    const suggestedTests = BIOMARKERS.filter(b =>
        b.cancerTypes.some(c =>
            c.toLowerCase().includes(cancerType.toLowerCase()) ||
            cancerType.toLowerCase().includes(c.toLowerCase().split(" ")[0])
        ) && !patientBiomarkers.some(p =>
            p.toLowerCase().includes(b.id.toLowerCase())
        )
    ).slice(0, 4);

    if (!suggestedTests.length) return null;

    return (
        <div style={{ marginTop: 16 }}>
            <button
                onClick={() => setVisible(!visible)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: "1.5px solid #FDE68A",
                    background: visible ? "#FFFBEB" : "#FFFFF5",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#92400E",
                    fontFamily: "Inter, sans-serif",
                }}
            >
                💡 {visible ? "Hide" : "Show"} AI Smart Suggestions
                <span>{visible ? "▲" : "▼"}</span>
            </button>

            {visible && (
                <div style={{
                    marginTop: 10,
                    padding: 14,
                    background: "#FFFBEB",
                    borderRadius: 12,
                    border: "1px solid #FDE68A",
                }}>
                    <div style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#92400E",
                        marginBottom: 10,
                    }}>
                        💡 Suggested Missing Biomarker Tests for {cancerType}
                    </div>

                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                    }}>
                        {suggestedTests.map((b, i) => (
                            <div key={i} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "8px 12px",
                                background: "#FFFFFF",
                                borderRadius: 8,
                                border: "1px solid #FDE68A",
                            }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    background: b.bg,
                                    borderRadius: 8,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 16,
                                    flexShrink: 0,
                                }}>
                                    {b.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: b.color,
                                    }}>
                                        {b.label} — {b.fullName}
                                    </div>
                                    <div style={{
                                        fontSize: 11,
                                        color: "#64748B",
                                        marginTop: 2,
                                    }}>
                                        {b.description}
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 10,
                                    padding: "2px 8px",
                                    borderRadius: 20,
                                    background: "#FEF3C7",
                                    color: "#92400E",
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                }}>
                                    Test Recommended
                                </span>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        marginTop: 10,
                        fontSize: 11,
                        color: "#78716C",
                        fontStyle: "italic",
                    }}>
                        ⚕️ These tests could unlock additional clinical trial eligibility
                        for this patient. Please consult with the clinical team.
                    </div>
                </div>
            )}
        </div>
    );
}