// src/components/TrialExplorer/FilterBar.jsx
// Status and Phase filter + search bar

import React from "react";
import { TRIAL_STATUSES, TRIAL_PHASES } from "../../data/cancerTypes";

export default function FilterBar({ filters, onFilter, searchText, onSearch }) {
    return (
        <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
            marginBottom: "1.25rem",
            padding: "12px 16px",
            background: "#f8fafc",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
        }}>

            {/* Search box */}
            <input
                type="text"
                value={searchText}
                onChange={e => onSearch(e.target.value)}
                placeholder="🔍  Search trials by keyword..."
                style={{
                    flex: 1,
                    minWidth: "200px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e0",
                    fontSize: "13px",
                    outline: "none",
                    background: "#fff",
                }}
            />

            {/* Status filter */}
            <select
                value={filters.status}
                onChange={e => onFilter({ status: e.target.value })}
                style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e0",
                    fontSize: "13px",
                    background: "#fff",
                    cursor: "pointer",
                }}
            >
                <option value="">All Statuses</option>
                {TRIAL_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                ))}
            </select>

            {/* Phase filter */}
            <select
                value={filters.phase}
                onChange={e => onFilter({ phase: e.target.value })}
                style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e0",
                    fontSize: "13px",
                    background: "#fff",
                    cursor: "pointer",
                }}
            >
                <option value="">All Phases</option>
                {TRIAL_PHASES.map(p => (
                    <option key={p} value={p}>{p.replace("PHASE", "Phase ")}</option>
                ))}
            </select>
        </div>
    );
}