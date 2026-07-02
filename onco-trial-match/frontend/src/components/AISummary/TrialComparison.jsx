// src/components/AISummary/TrialComparison.jsx
// Side-by-side comparison of 2 trials

import React, { useState } from "react";

export default function TrialComparison({ matches = [] }) {
    const [trialA, setTrialA] = useState(0);
    const [trialB, setTrialB] = useState(1);
    const [visible, setVisible] = useState(false);

    if (matches.length < 2) return null;

    const matchA = matches[trialA];
    const matchB = matches[trialB];

    const rows = [
        { label: "NCT ID", a: matchA.trial.nct_id, b: matchB.trial.nct_id },
        { label: "Phase", a: matchA.trial.phase || "N/A", b: matchB.trial.phase || "N/A" },
        { label: "Match Score", a: `${Math.round((matchA.similarity_score || 0) * 100)}%`, b: `${Math.round((matchB.similarity_score || 0) * 100)}%` },
        { label: "Status", a: matchA.status || "Pending", b: matchB.status || "Pending" },
        { label: "Sponsor", a: matchA.trial.sponsor || "N/A", b: matchB.trial.sponsor || "N/A" },
        { label: "Start Date", a: matchA.trial.startDate || "N/A", b: matchB.trial.startDate || "N/A" },
        { label: "Enrollment", a: matchA.trial.enrollment ? `${matchA.trial.enrollment} pts` : "N/A", b: matchB.trial.enrollment ? `${matchB.trial.enrollment} pts` : "N/A" },
    ];

    const scoreA = Math.round((matchA.similarity_score || 0) * 100);
    const scoreB = Math.round((matchB.similarity_score || 0) * 100);

    return (
        <div style={{ marginBottom: 20 }}>
            <button
                onClick={() => setVisible(!visible)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 18px",
                    borderRadius: 10,
                    border: "1.5px solid #6366F1",
                    background: visible ? "#EEF2FF" : "#F8FAFF",
                    color: "#6366F1",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                }}
            >
                ⚖️ Compare Trials Side-by-Side
                <span>{visible ? "▲" : "▼"}</span>
            </button>

            {visible && (
                <div style={{
                    marginTop: 12,
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 14,
                    overflow: "hidden",
                }}>
                    {/* Header */}
                    <div style={{
                        background: "#F8FAFF",
                        padding: "14px 18px",
                        borderBottom: "1px solid #E2E8F0",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}>
                        <span style={{ fontSize: 16 }}>⚖️</span>
                        <span style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#1E293B",
                        }}>
                            Trial Comparison
                        </span>
                    </div>

                    {/* Trial selectors */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "40px 1fr 40px 1fr",
                        gap: 12,
                        padding: "14px 18px",
                        borderBottom: "1px solid #F1F5F9",
                        alignItems: "center",
                    }}>
                        <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#6366F1",
                            textAlign: "center",
                        }}>A</span>
                        <select
                            value={trialA}
                            onChange={e => setTrialA(Number(e.target.value))}
                            className="form-select"
                            style={{ fontSize: 12 }}
                        >
                            {matches.map((m, i) => (
                                <option key={i} value={i}>
                                    #{i + 1} — {m.trial.title.slice(0, 50)}…
                                </option>
                            ))}
                        </select>
                        <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#8B5CF6",
                            textAlign: "center",
                        }}>B</span>
                        <select
                            value={trialB}
                            onChange={e => setTrialB(Number(e.target.value))}
                            className="form-select"
                            style={{ fontSize: 12 }}
                        >
                            {matches.map((m, i) => (
                                <option key={i} value={i}>
                                    #{i + 1} — {m.trial.title.slice(0, 50)}…
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Trial titles */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 0,
                    }}>
                        <div style={{
                            padding: "12px 18px",
                            background: "#EEF2FF",
                            borderRight: "1px solid #E2E8F0",
                        }}>
                            <div style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#6366F1",
                                marginBottom: 4,
                            }}>
                                Trial A
                            </div>
                            <div style={{
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: "#1E293B",
                                lineHeight: 1.4,
                            }}>
                                {matchA.trial.title}
                            </div>
                        </div>
                        <div style={{
                            padding: "12px 18px",
                            background: "#F5F3FF",
                        }}>
                            <div style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#8B5CF6",
                                marginBottom: 4,
                            }}>
                                Trial B
                            </div>
                            <div style={{
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: "#1E293B",
                                lineHeight: 1.4,
                            }}>
                                {matchB.trial.title}
                            </div>
                        </div>
                    </div>

                    {/* Comparison rows */}
                    {rows.map((row, i) => {
                        const isScore = row.label === "Match Score";
                        const aWins = isScore && scoreA > scoreB;
                        const bWins = isScore && scoreB > scoreA;

                        return (
                            <div key={i} style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                borderTop: "1px solid #F1F5F9",
                            }}>
                                <div style={{
                                    padding: "10px 18px",
                                    borderRight: "1px solid #F1F5F9",
                                    background: aWins ? "#ECFDF5" : "#FFFFFF",
                                }}>
                                    <div style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: "#94A3B8",
                                        textTransform: "uppercase",
                                        marginBottom: 3,
                                    }}>
                                        {row.label}
                                    </div>
                                    <div style={{
                                        fontSize: 13,
                                        fontWeight: aWins ? 700 : 400,
                                        color: aWins ? "#059669" : "#374151",
                                    }}>
                                        {row.a} {aWins && "🏆"}
                                    </div>
                                </div>
                                <div style={{
                                    padding: "10px 18px",
                                    background: bWins ? "#ECFDF5" : "#FFFFFF",
                                }}>
                                    <div style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: "#94A3B8",
                                        textTransform: "uppercase",
                                        marginBottom: 3,
                                    }}>
                                        {row.label}
                                    </div>
                                    <div style={{
                                        fontSize: 13,
                                        fontWeight: bWins ? 700 : 400,
                                        color: bWins ? "#059669" : "#374151",
                                    }}>
                                        {row.b} {bWins && "🏆"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Winner banner */}
                    {scoreA !== scoreB && (
                        <div style={{
                            padding: "12px 18px",
                            background: "#ECFDF5",
                            borderTop: "1px solid #A7F3D0",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#059669",
                        }}>
                            🏆 Trial {scoreA > scoreB ? "A" : "B"} has a higher AI match score
                            ({scoreA > scoreB ? scoreA : scoreB}%) — recommended as first choice
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}