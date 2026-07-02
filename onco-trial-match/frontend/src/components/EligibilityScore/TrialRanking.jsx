// src/components/EligibilityScore/TrialRanking.jsx
// Shows ranking badge for each trial match

import React from "react";

export default function TrialRanking({ rank, total }) {
    if (!rank) return null;

    const medal =
        rank === 1 ? "🥇" :
            rank === 2 ? "🥈" :
                rank === 3 ? "🥉" : null;

    const color =
        rank === 1 ? "#F59E0B" :
            rank === 2 ? "#94A3B8" :
                rank === 3 ? "#CD7F32" : "#6366F1";

    return (
        <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 10px",
            borderRadius: 20,
            background: rank <= 3 ? `${color}15` : "#F1F5F9",
            border: `1px solid ${color}33`,
            fontSize: 11,
            fontWeight: 700,
            color,
        }}>
            {medal && <span>{medal}</span>}
            #{rank} of {total}
        </div>
    );
}