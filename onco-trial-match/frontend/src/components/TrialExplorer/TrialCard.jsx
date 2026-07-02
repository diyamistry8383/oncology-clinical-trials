import React, { useState } from "react";

const STATUS_COLORS = {
    RECRUITING: { color: "#2E7D32", bg: "#E8F5E9" },
    NOT_YET_RECRUITING: { color: "#1565C0", bg: "#E3F2FD" },
    ACTIVE_NOT_RECRUITING: { color: "#F57F17", bg: "#FFF8E1" },
    COMPLETED: { color: "#546E7A", bg: "#ECEFF1" },
};

function Detail({ label, value }) {
    return (
        <div>
            <div
                style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#718096",
                    textTransform: "uppercase",
                    marginBottom: "2px",
                }}
            >
                {label}
            </div>
            <div style={{ fontSize: "12.5px", color: "#2d3748" }}>
                {value || "N/A"}
            </div>
        </div>
    );
}

export default function TrialCard({ trial, cancerColor }) {
    const [expanded, setExpanded] = useState(false);

    const statusStyle =
        STATUS_COLORS[trial.status] || { color: "#718096", bg: "#EDF2F7" };

    return (
        <div
            style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                background: "#fff",
                marginBottom: "10px",
                borderLeft: `4px solid ${cancerColor || "#4a90d9"}`,
                transition: "box-shadow 0.2s",
            }}
            onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")
            }
            onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = "none")
            }
        >

            {/* Header Row */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                }}
            >
                <div style={{ flex: 1 }}>

                    {/* Status + Phase + NCT Badges */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "6px",
                            flexWrap: "wrap",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "2px 8px",
                                borderRadius: "20px",
                                background: statusStyle.bg,
                                color: statusStyle.color,
                            }}
                        >
                            {trial.status.replace(/_/g, " ")}
                        </span>

                        {trial.phase !== "N/A" && (
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    padding: "2px 8px",
                                    borderRadius: "20px",
                                    background: "#EDF2F7",
                                    color: "#4a5568",
                                }}
                            >
                                {trial.phase}
                            </span>
                        )}

                        <span style={{ fontSize: "11px", color: "#a0aec0" }}>
                            {trial.nctId}
                        </span>
                    </div>

                    {/* Trial Title */}
                    <h3
                        style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#1a202c",
                            lineHeight: 1.4,
                            margin: 0,
                        }}
                    >
                        {trial.title}
                    </h3>
                </div>

                {/* Expand Button */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        background: expanded ? "#f0f4ff" : "#fff",
                        cursor: "pointer",
                        fontSize: "12px",
                        color: "#4a5568",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                    }}
                >
                    {expanded ? "▲ Less" : "▼ More"}
                </button>
            </div>

            {/* Summary */}
            <p
                style={{
                    fontSize: "12.5px",
                    color: "#718096",
                    marginTop: "8px",
                    lineHeight: 1.6,
                    display: "-webkit-box",
                    WebkitLineClamp: expanded ? "unset" : 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                }}
            >
                {trial.summary}
            </p>

            {/* Expanded Section */}
            {expanded && (
                <div
                    style={{
                        marginTop: "12px",
                        borderTop: "1px solid #e2e8f0",
                        paddingTop: "12px",
                    }}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                        }}
                    >
                        <Detail label="Sponsor" value={trial.sponsor} />
                        <Detail
                            label="Enrollment"
                            value={
                                trial.enrollment ? `${trial.enrollment} patients` : "N/A"
                            }
                        />
                        <Detail
                            label="Age Range"
                            value={`${trial.minAge} – ${trial.maxAge}`}
                        />
                        <Detail label="Gender" value={trial.gender} />
                        <Detail label="Start Date" value={trial.startDate} />
                        <Detail label="Interventions" value={trial.interventions} />

                        {/* Locations */}
                        {trial.locations && trial.locations.length > 0 && (
                            <div style={{ gridColumn: "1 / -1" }}>
                                <div
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#718096",
                                        textTransform: "uppercase",
                                        marginBottom: "6px",
                                    }}
                                >
                                    Locations
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                    {trial.locations.slice(0, 5).map((loc, i) => (
                                        <span
                                            key={i}
                                            style={{
                                                fontSize: "11px",
                                                padding: "2px 8px",
                                                borderRadius: "4px",
                                                background: "#f0f4ff",
                                                color: "#4a5568",
                                            }}
                                        >
                                            📍 {loc}
                                        </span>
                                    ))}
                                    {trial.locations.length > 5 && (
                                        <span style={{ fontSize: "11px", color: "#a0aec0" }}>
                                            +{trial.locations.length - 5} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* External Link */}
                    <a
                        href={trial.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "inline-block",
                            marginTop: "12px",
                            fontSize: "12px",
                            color: "#3182ce",
                            textDecoration: "none",
                            fontWeight: 500,
                        }}
                    >
                        🔗 View full trial on ClinicalTrials.gov →
                    </a>
                </div>
            )}

        </div>
    );
}