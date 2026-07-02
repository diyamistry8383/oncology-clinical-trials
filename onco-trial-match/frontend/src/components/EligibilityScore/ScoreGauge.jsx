// src/components/EligibilityScore/ScoreGauge.jsx
// Circular gauge showing match percentage

import React from "react";

export default function ScoreGauge({ score }) {
    const pct = Math.round((score || 0) * 100);

    const color =
        pct >= 80 ? "#10B981" :
            pct >= 60 ? "#6366F1" :
                pct >= 40 ? "#F59E0B" :
                    "#EF4444";

    const bg =
        pct >= 80 ? "#ECFDF5" :
            pct >= 60 ? "#EEF2FF" :
                pct >= 40 ? "#FFFBEB" :
                    "#FEF2F2";

    const label =
        pct >= 80 ? "Excellent Match" :
            pct >= 60 ? "Good Match" :
                pct >= 40 ? "Partial Match" :
                    "Low Match";

    // SVG circle math
    const r = 28;
    const cx = 36;
    const cy = 36;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 16px",
            background: bg,
            borderRadius: 12,
            border: `1.5px solid ${color}22`,
            width: "fit-content",
            marginTop: 12,
        }}>
            {/* SVG Gauge */}
            <svg width="72" height="72" viewBox="0 0 72 72">
                {/* Background circle */}
                <circle
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="7"
                />
                {/* Progress circle */}
                <circle
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeDashoffset={circ / 4}
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
                {/* Percentage text */}
                <text
                    x={cx} y={cy + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={color}
                    fontSize="13"
                    fontWeight="800"
                    fontFamily="Inter, sans-serif"
                >
                    {pct}%
                </text>
            </svg>

            {/* Label */}
            <div>
                <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color,
                    marginBottom: 3,
                }}>
                    {label}
                </div>
                <div style={{
                    fontSize: 12,
                    color: "#64748B",
                }}>
                    AI Eligibility Score
                </div>
                {/* Progress bar */}
                <div style={{
                    width: 120,
                    height: 5,
                    background: "#E2E8F0",
                    borderRadius: 3,
                    marginTop: 6,
                    overflow: "hidden",
                }}>
                    <div style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: color,
                        borderRadius: 3,
                        transition: "width 0.6s ease",
                    }} />
                </div>
            </div>
        </div>
    );
}