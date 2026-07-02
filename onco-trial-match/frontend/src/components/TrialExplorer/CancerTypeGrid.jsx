// src/components/TrialExplorer/CancerTypeGrid.jsx
// The top grid of cancer type cards the user clicks to filter

import React from "react";
import { CANCER_TYPES } from "../../data/cancerTypes";

export default function CancerTypeGrid({ selectedId, onSelect }) {
    return (
        <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px", color: "#1a202c" }}>
                Select Cancer Type
            </h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "10px",
            }}>
                {CANCER_TYPES.map((cancer) => {
                    const isSelected = selectedId === cancer.id;
                    return (
                        <button
                            key={cancer.id}
                            onClick={() => onSelect(cancer)}
                            style={{
                                border: isSelected
                                    ? `2px solid ${cancer.color}`
                                    : "1.5px solid #e2e8f0",
                                borderRadius: "12px",
                                padding: "14px 10px",
                                background: isSelected ? cancer.bgColor : "#fff",
                                cursor: "pointer",
                                textAlign: "center",
                                transition: "all 0.2s",
                                boxShadow: isSelected ? `0 0 0 3px ${cancer.color}22` : "none",
                            }}
                        >
                            <div style={{ fontSize: "28px", marginBottom: "6px" }}>{cancer.icon}</div>
                            <div style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: isSelected ? cancer.color : "#4a5568",
                                lineHeight: 1.3,
                            }}>
                                {cancer.label}
                            </div>
                            <div style={{
                                fontSize: "10px",
                                color: "#a0aec0",
                                marginTop: "4px",
                            }}>
                                {cancer.commonBiomarkers.slice(0, 2).join(" · ")}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}