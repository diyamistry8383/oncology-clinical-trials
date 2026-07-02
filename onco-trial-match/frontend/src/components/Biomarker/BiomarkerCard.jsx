// src/components/Biomarker/BiomarkerCard.jsx
// Single biomarker card with full info

import React, { useState } from "react";
import { getBiomarkerInfo } from "../../data/biomarkers";

export default function BiomarkerCard({ name, matched = false }) {
    const [expanded, setExpanded] = useState(false);
    const info = getBiomarkerInfo(name);

    if (!info) {
        // Unknown biomarker — simple pill
        return (
            <span style={{
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: matched ? "#ECFDF5" : "#F1F5F9",
                color: matched ? "#059669" : "#64748B",
                border: `1px solid ${matched ? "#A7F3D0" : "#E2E8F0"}`,
                cursor: "default",
            }}>
                {matched ? "✅" : "○"} {name}
            </span>
        );
    }

    return (
        <div style={{ display: "inline-block", position: "relative" }}>
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    background: matched ? info.bg : "#F8FAFF",
                    color: matched ? info.color : "#94A3B8",
                    border: `1.5px solid ${matched ? info.color + "44" : "#E2E8F0"}`,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.2s",
                }}
            >
                <span>{info.icon}</span>
                {matched ? "✅" : "○"} {info.label}
                <span style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
            </button>

            {/* Expanded popup */}
            {expanded && (
                <div style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    zIndex: 100,
                    width: 260,
                    background: "#FFFFFF",
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    padding: 14,
                }}>
                    {/* Header */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                        paddingBottom: 10,
                        borderBottom: "1px solid #F1F5F9",
                    }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            background: info.bg,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            flexShrink: 0,
                        }}>
                            {info.icon}
                        </div>
                        <div>
                            <div style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: info.color,
                            }}>
                                {info.label}
                            </div>
                            <div style={{ fontSize: 10, color: "#94A3B8" }}>
                                {info.fullName}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <p style={{
                        fontSize: 12,
                        color: "#374151",
                        lineHeight: 1.5,
                        marginBottom: 10,
                    }}>
                        {info.description}
                    </p>

                    {/* Cancer types */}
                    <div style={{ marginBottom: 10 }}>
                        <div style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#94A3B8",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 6,
                        }}>
                            Associated Cancers
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {info.cancerTypes.map((c, i) => (
                                <span key={i} style={{
                                    fontSize: 10,
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    background: info.bg,
                                    color: info.color,
                                    fontWeight: 500,
                                }}>
                                    {c}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Targeted therapies */}
                    <div>
                        <div style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#94A3B8",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 6,
                        }}>
                            🎯 Targeted Therapies
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {info.targetedTherapies.map((t, i) => (
                                <span key={i} style={{
                                    fontSize: 10,
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    background: "#F0F4FF",
                                    color: "#6366F1",
                                    fontWeight: 500,
                                }}>
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Close */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                        style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#94A3B8",
                            fontSize: 14,
                            padding: 4,
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}