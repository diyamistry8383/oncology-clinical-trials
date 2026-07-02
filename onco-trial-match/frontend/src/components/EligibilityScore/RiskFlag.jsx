// src/components/EligibilityScore/RiskFlag.jsx
// Shows risk warnings for patient-trial participation

import React from "react";

export default function RiskFlag({ concerns = [], score }) {
    const pct = Math.round((score || 0) * 100);

    const riskLevel =
        pct < 30 ? "HIGH" :
            pct < 60 ? "MEDIUM" : "LOW";

    const riskColor =
        riskLevel === "HIGH" ? "#EF4444" :
            riskLevel === "MEDIUM" ? "#F59E0B" : "#10B981";

    const riskBg =
        riskLevel === "HIGH" ? "#FEF2F2" :
            riskLevel === "MEDIUM" ? "#FFFBEB" : "#ECFDF5";

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 8,
            background: riskBg,
            border: `1px solid ${riskColor}33`,
            width: "fit-content",
            marginTop: 8,
        }}>
            <span style={{ fontSize: 14 }}>
                {riskLevel === "HIGH" ? "🔴" :
                    riskLevel === "MEDIUM" ? "🟡" : "🟢"}
            </span>
            <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: riskColor,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
            }}>
                {riskLevel} RISK
            </span>
            {concerns.length > 0 && (
                <span style={{
                    fontSize: 11,
                    color: "#64748B",
                    fontWeight: 400,
                }}>
                    · {concerns.length} concern{concerns.length > 1 ? "s" : ""} flagged
                </span>
            )}
        </div>
    );
}