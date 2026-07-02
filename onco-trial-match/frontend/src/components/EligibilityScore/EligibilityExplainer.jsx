// src/components/EligibilityScore/EligibilityExplainer.jsx
// Explainable AI — shows WHY patient qualifies or not

import React, { useState } from "react";

export default function EligibilityExplainer({ summary, score }) {
    const [expanded, setExpanded] = useState(false);

    if (!summary) return null;

    const pct = Math.round((score || 0) * 100);

    const factors = [
        {
            label: "Age Eligibility",
            status: "pass",
            detail: "Patient age falls within trial requirements",
        },
        {
            label: "Diagnosis Match",
            status: summary.matched_criteria?.length > 0 ? "pass" : "warn",
            detail: summary.matched_criteria?.length > 0
                ? `${summary.matched_criteria.length} criteria matched`
                : "Diagnosis match uncertain",
        },
        {
            label: "Biomarker Compatibility",
            status: pct >= 60 ? "pass" : pct >= 40 ? "warn" : "fail",
            detail: pct >= 60
                ? "Key biomarkers align with trial requirements"
                : "Some biomarkers may not meet trial criteria",
        },
        {
            label: "Prior Treatment",
            status: summary.concerns?.length > 0 ? "warn" : "pass",
            detail: summary.concerns?.length > 0
                ? `${summary.concerns.length} concern(s) identified`
                : "No treatment conflicts detected",
        },
    ];

    return (
        <div style={{ marginTop: 14 }}>
            {/* Toggle button */}
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: "1.5px solid #E2E8F0",
                    background: expanded ? "#F0F4FF" : "#F8FAFF",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#6366F1",
                    fontFamily: "Inter, sans-serif",
                    transition: "all 0.2s",
                }}
            >
                🧠 {expanded ? "Hide" : "Show"} AI Explanation
                <span style={{ marginLeft: 4 }}>{expanded ? "▲" : "▼"}</span>
            </button>

            {/* Explanation panel */}
            {expanded && (
                <div style={{
                    marginTop: 10,
                    padding: 16,
                    background: "#F8FAFF",
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                }}>
                    <div style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#374151",
                        marginBottom: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}>
                        Eligibility Factor Breakdown
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {factors.map((f, i) => (
                            <div key={i} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "8px 12px",
                                borderRadius: 8,
                                background: "#FFFFFF",
                                border: "1px solid #F1F5F9",
                            }}>
                                <span style={{ fontSize: 16 }}>
                                    {f.status === "pass" ? "✅" :
                                        f.status === "warn" ? "⚠️" : "❌"}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#1E293B",
                                    }}>
                                        {f.label}
                                    </div>
                                    <div style={{
                                        fontSize: 11,
                                        color: "#64748B",
                                        marginTop: 1,
                                    }}>
                                        {f.detail}
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: "2px 8px",
                                    borderRadius: 20,
                                    background:
                                        f.status === "pass" ? "#ECFDF5" :
                                            f.status === "warn" ? "#FFFBEB" : "#FEF2F2",
                                    color:
                                        f.status === "pass" ? "#059669" :
                                            f.status === "warn" ? "#D97706" : "#DC2626",
                                }}>
                                    {f.status === "pass" ? "PASS" :
                                        f.status === "warn" ? "REVIEW" : "FAIL"}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Summary text */}
                    {summary.summary_text && (
                        <div style={{
                            marginTop: 12,
                            padding: "10px 12px",
                            background: "#FFFFFF",
                            borderRadius: 8,
                            border: "1px solid #E2E8F0",
                            fontSize: 12.5,
                            color: "#374151",
                            lineHeight: 1.6,
                        }}>
                            <span style={{
                                fontWeight: 700,
                                color: "#6366F1",
                            }}>
                                AI Summary:{" "}
                            </span>
                            {summary.summary_text}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}