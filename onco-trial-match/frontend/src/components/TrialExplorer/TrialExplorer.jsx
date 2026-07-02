// src/components/TrialExplorer/TrialExplorer.jsx
// MAIN component — put this in your page/router

import React from "react";
import CancerTypeGrid from "./CancerTypeGrid";
import FilterBar from "./FilterBar";
import TrialCard from "./TrialCard";
import { useTrialExplorer } from "../../hooks/useTrialExplorer";

export default function TrialExplorer() {
    const {
        selectedCancer, selectCancer,
        trials, loading, error, total, hasMore, loadMore,
        filters, applyFilter,
        searchText, setSearchText,
    } = useTrialExplorer();

    return (
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "24px 16px", fontFamily: "Inter, system-ui, sans-serif" }}>

            {/* Page header */}
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#1a202c", margin: 0 }}>
                    🧬 Cancer Trial Explorer
                </h1>
                <p style={{ fontSize: "13px", color: "#718096", marginTop: "4px" }}>
                    Browse real open clinical trials from ClinicalTrials.gov by cancer type
                </p>
            </div>

            {/* Step 1: Pick cancer type */}
            <CancerTypeGrid
                selectedId={selectedCancer?.id}
                onSelect={selectCancer}
            />

            {/* Step 2: Filters — only shown after cancer type selected */}
            {selectedCancer && (
                <>
                    <FilterBar
                        filters={filters}
                        onFilter={applyFilter}
                        searchText={searchText}
                        onSearch={setSearchText}
                    />

                    {/* Results header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "22px" }}>{selectedCancer.icon}</span>
                            <div>
                                <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a202c" }}>
                                    {selectedCancer.label} Trials
                                </div>
                                {total > 0 && !loading && (
                                    <div style={{ fontSize: "12px", color: "#718096" }}>
                                        {total.toLocaleString()} trials found · showing {trials.length}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Biomarker chips */}
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                            {selectedCancer.commonBiomarkers.map(b => (
                                <span key={b} style={{
                                    fontSize: "10px", padding: "2px 7px", borderRadius: "4px",
                                    background: selectedCancer.bgColor, color: selectedCancer.color,
                                    fontWeight: 600,
                                }}>
                                    {b}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Loading state */}
                    {loading && trials.length === 0 && (
                        <div style={{ textAlign: "center", padding: "48px", color: "#718096" }}>
                            <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div>
                            <div>Loading {selectedCancer.label} trials...</div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div style={{
                            padding: "16px", background: "#FFF5F5", border: "1px solid #FEB2B2",
                            borderRadius: "10px", color: "#C53030", fontSize: "13px",
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* No results state */}
                    {!loading && !error && trials.length === 0 && total === 0 && (
                        <div style={{ textAlign: "center", padding: "48px", color: "#718096" }}>
                            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔍</div>
                            <div>No trials found. Try changing the filter.</div>
                        </div>
                    )}

                    {/* Trial cards */}
                    <div>
                        {trials.map(trial => (
                            <TrialCard
                                key={trial.nctId}
                                trial={trial}
                                cancerColor={selectedCancer.color}
                            />
                        ))}
                    </div>

                    {/* Load More button */}
                    {hasMore && !loading && (
                        <div style={{ textAlign: "center", marginTop: "16px" }}>
                            <button
                                onClick={loadMore}
                                style={{
                                    padding: "10px 28px", borderRadius: "8px",
                                    border: `1.5px solid ${selectedCancer.color}`,
                                    color: selectedCancer.color, background: selectedCancer.bgColor,
                                    cursor: "pointer", fontSize: "13px", fontWeight: 600,
                                }}
                            >
                                Load More Trials
                            </button>
                        </div>
                    )}

                    {/* Loading more spinner */}
                    {loading && trials.length > 0 && (
                        <div style={{ textAlign: "center", padding: "16px", color: "#718096", fontSize: "13px" }}>
                            Loading more...
                        </div>
                    )}
                </>
            )}

            {/* Empty state — no cancer selected yet */}
            {!selectedCancer && (
                <div style={{ textAlign: "center", padding: "48px", color: "#a0aec0" }}>
                    <div style={{ fontSize: "40px", marginBottom: "10px" }}>👆</div>
                    <div style={{ fontSize: "14px" }}>Click a cancer type above to see matching clinical trials</div>
                </div>
            )}
        </div>
    );
}