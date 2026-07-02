import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPatient, listPatientMatches, matchPatientToTrials } from "../api/client.js";
import SimilarityGauge from "../components/SimilarityGauge.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TrialExplorer from "../components/TrialExplorer/TrialExplorer.jsx";
import ScoreGauge from "../components/EligibilityScore/ScoreGauge.jsx";
import EligibilityExplainer from "../components/EligibilityScore/EligibilityExplainer.jsx";
import RiskFlag from "../components/EligibilityScore/RiskFlag.jsx";
import TrialRanking from "../components/EligibilityScore/TrialRanking.jsx";
import BiomarkerPanel from "../components/Biomarker/BiomarkerPanel.jsx";
import TreatmentHistory from "../components/Biomarker/TreatmentHistory.jsx";
import SmartSuggestions from "../components/Biomarker/SmartSuggestions.jsx";
import TrialSummaryCard from "../components/AISummary/TrialSummaryCard.jsx";
import TrialComparison from "../components/AISummary/TrialComparison.jsx";

export default function TrialMatchList() {
    const { patientId } = useParams();
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [matching, setMatching] = useState(false);
    const [error, setError] = useState(null);
    const [topK, setTopK] = useState(5);
    const [activeTab, setActiveTab] = useState("matches");

    useEffect(() => { loadData(); }, [patientId]);

    async function loadData() {
        setLoading(true);
        setError(null);
        try {
            const [patientData, matchesData] = await Promise.all([
                getPatient(patientId),
                listPatientMatches(patientId),
            ]);
            setPatient(patientData);
            setMatches(matchesData);
        } catch (err) {
            setError("Couldn't load this patient's matches.");
        } finally {
            setLoading(false);
        }
    }

    async function handleRunMatch() {
        setMatching(true);
        setError(null);
        try {
            await matchPatientToTrials(patientId, {
                top_k: Number(topK),
                include_llm_summary: true,
            });
            await loadData();
        } catch (err) {
            setError("Matching failed. Check that the backend can reach ChromaDB and the embedding model.");
        } finally {
            setMatching(false);
        }
    }

    if (loading) return (
        <Layout title="Trial Matches">
            <p className="loading-text">⏳ Loading patient data…</p>
        </Layout>
    );

    return (
        <Layout title="Trial Matches">

            {/* Back button */}
            <button
                className="btn btn-secondary btn-sm"
                style={{ marginBottom: 20 }}
                onClick={() => navigate("/")}
            >
                ← All Patients
            </button>

            {/* Patient Header Card */}
            <div className="card" style={{ marginBottom: 24, padding: 0, overflow: "hidden" }}>
                <div style={{
                    background: "linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)",
                    padding: "24px 28px",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            background: "rgba(255,255,255,0.2)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            flexShrink: 0,
                        }}>
                            👤
                        </div>
                        <div>
                            <h1 style={{
                                fontSize: 22,
                                fontWeight: 800,
                                color: "#FFFFFF",
                                margin: 0,
                                letterSpacing: "-0.3px",
                            }}>
                                {patient ? patient.display_name : "Patient"}
                            </h1>
                            <p style={{
                                fontSize: 14,
                                color: "rgba(255,255,255,0.8)",
                                marginTop: 4,
                                fontWeight: 400,
                            }}>
                                {patient
                                    ? `${patient.primary_diagnosis} · ${patient.age} years old · ${patient.sex}`
                                    : ""}
                            </p>
                        </div>
                        {patient?.cancer_type && (
                            <span style={{
                                marginLeft: "auto",
                                background: "rgba(255,255,255,0.2)",
                                color: "#FFFFFF",
                                fontSize: 12,
                                fontWeight: 600,
                                padding: "6px 14px",
                                borderRadius: 20,
                            }}>
                                🧬 {patient.cancer_type}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                {patient && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        borderTop: "1px solid #F1F5F9",
                    }}>
                        {[
                            { label: "Stage", value: patient.stage || "N/A", icon: "📊" },
                            { label: "ECOG", value: patient.ecog_status ?? "N/A", icon: "💊" },
                            { label: "Biomarkers", value: patient.biomarkers?.length || 0, icon: "🔬" },
                            { label: "AI Matches", value: matches.length, icon: "🎯" },
                        ].map((stat, i) => (
                            <div key={i} style={{
                                padding: "16px 20px",
                                borderRight: i < 3 ? "1px solid #F1F5F9" : "none",
                                textAlign: "center",
                            }}>
                                <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>
                                    {stat.value}
                                </div>
                                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {error && <div className="error-banner">⚠️ {error}</div>}

            {/* Tab Switcher */}
            <div style={{
                display: "flex",
                gap: 4,
                marginBottom: 24,
                background: "#F1F5F9",
                padding: 4,
                borderRadius: 12,
                width: "fit-content",
            }}>
                <button
                    onClick={() => setActiveTab("matches")}
                    style={{
                        padding: "9px 20px",
                        border: "none",
                        borderRadius: 9,
                        cursor: "pointer",
                        fontSize: 13.5,
                        fontWeight: 600,
                        fontFamily: "Inter, sans-serif",
                        transition: "all 0.2s",
                        background: activeTab === "matches"
                            ? "linear-gradient(135deg, #6366F1, #4F46E5)"
                            : "transparent",
                        color: activeTab === "matches" ? "#FFFFFF" : "#64748B",
                        boxShadow: activeTab === "matches"
                            ? "0 2px 8px rgba(99,102,241,0.35)"
                            : "none",
                    }}
                >
                    🎯 AI Matched Trials
                    {matches.length > 0 && (
                        <span style={{
                            marginLeft: 8,
                            background: activeTab === "matches"
                                ? "rgba(255,255,255,0.25)"
                                : "#6366F1",
                            color: "#fff",
                            fontSize: 11,
                            padding: "1px 7px",
                            borderRadius: 20,
                        }}>
                            {matches.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab("explorer")}
                    style={{
                        padding: "9px 20px",
                        border: "none",
                        borderRadius: 9,
                        cursor: "pointer",
                        fontSize: 13.5,
                        fontWeight: 600,
                        fontFamily: "Inter, sans-serif",
                        transition: "all 0.2s",
                        background: activeTab === "explorer"
                            ? "linear-gradient(135deg, #06B6D4, #0891B2)"
                            : "transparent",
                        color: activeTab === "explorer" ? "#FFFFFF" : "#64748B",
                        boxShadow: activeTab === "explorer"
                            ? "0 2px 8px rgba(6,182,212,0.35)"
                            : "none",
                    }}
                >
                    🧬 Cancer Trial Explorer
                </button>
            </div>

            {/* TAB 1: AI Matched Trials */}
            {activeTab === "matches" && (
                <div>
                    {/* Match Controls */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="card-body" style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            flexWrap: "wrap",
                        }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                                🤖 Run AI Matching
                            </div>
                            <label className="form-label" htmlFor="top-k">
                                Top matches:
                            </label>
                            <select
                                id="top-k"
                                className="form-select"
                                value={topK}
                                onChange={(e) => setTopK(e.target.value)}
                                style={{ width: 80 }}
                            >
                                <option value={3}>3</option>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                            </select>
                            <button
                                className="btn btn-primary"
                                onClick={handleRunMatch}
                                disabled={matching}
                            >
                                {matching ? "⏳ Finding matches…" : "🔍 Find Matching Trials"}
                            </button>
                            {matches.length > 0 && (
                                <span className="badge badge-success" style={{ marginLeft: "auto" }}>
                                    ✅ {matches.length} matches found
                                </span>
                            )}
                        </div>

                        {/* Smart Suggestions */}
                        {patient && (
                            <div style={{ padding: "0 24px 20px" }}>
                                <SmartSuggestions
                                    patientBiomarkers={patient.biomarkers || []}
                                    cancerType={patient.cancer_type || ""}
                                />
                            </div>
                        )}
                    </div>

                    {/* Trial Comparison Tool */}
                    {matches.length >= 2 && (
                        <TrialComparison matches={matches} />
                    )}

                    {/* Match Results */}
                    {matches.length === 0 ? (
                        <div className="card empty-state">
                            <div className="empty-state-icon">🔍</div>
                            <p className="empty-state-title">No matches yet</p>
                            <p className="empty-state-body">
                                Click "Find Matching Trials" to run AI semantic search
                                against open clinical trials.
                            </p>
                        </div>
                    ) : (
                        <div className="match-list">
                            {matches.map((match, index) => (
                                <MatchCard
                                    key={match.id}
                                    match={match}
                                    rank={index + 1}
                                    total={matches.length}
                                    patient={patient}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: Cancer Trial Explorer */}
            {activeTab === "explorer" && (
                <TrialExplorer />
            )}

        </Layout>
    );
}

function MatchCard({ match, rank, total, patient }) {
    const summary = match.llm_summary;

    return (
        <div className="card match-card">

            {/* Header */}
            <div className="match-card-header">
                <div style={{ flex: 1 }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                        flexWrap: "wrap",
                    }}>
                        <TrialRanking rank={rank} total={total} />
                        <span className="badge badge-info">{match.trial.nct_id}</span>
                        <span className="badge badge-purple">
                            {match.trial.phase || "Phase N/A"}
                        </span>
                    </div>
                    <a
                        href={`https://clinicaltrials.gov/study/${match.trial.nct_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="match-card-title"
                    >
                        {match.trial.title}
                    </a>
                </div>
                <StatusBadge status={match.status} />
            </div>

            {/* Score + Risk row */}
            <div style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                flexWrap: "wrap",
                marginTop: 4,
            }}>
                <ScoreGauge score={match.similarity_score} />
                <div style={{ paddingTop: 12 }}>
                    <RiskFlag
                        concerns={summary?.concerns || []}
                        score={match.similarity_score}
                    />
                </div>
            </div>

            {/* Biomarker Panel */}
            <BiomarkerPanel
                patientBiomarkers={patient?.biomarkers || []}
                trialText={
                    match.trial.title + " " +
                    (match.trial.conditions?.join(" ") || "")
                }
            />

            {/* Treatment History */}
            <TreatmentHistory
                treatments={patient?.prior_treatments || []}
                trialText={match.trial.title}
            />

            {/* AI Summary + Explainer */}
            {
                summary ? (
                    <div className="match-card-summary">
                        {summary.matched_criteria?.length > 0 && (
                            <div className="match-card-criteria-group">
                                <span className="match-card-criteria-label match-card-criteria-label--match">
                                    ✅ Matched Criteria
                                </span>
                                <ul className="match-card-criteria-list">
                                    {summary.matched_criteria.map((c, i) => (
                                        <li key={i}>{c}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {summary.concerns?.length > 0 && (
                            <div className="match-card-criteria-group">
                                <span className="match-card-criteria-label match-card-criteria-label--concern">
                                    ⚠️ Needs Review
                                </span>
                                <ul className="match-card-criteria-list">
                                    {summary.concerns.map((c, i) => (
                                        <li key={i}>{c}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <EligibilityExplainer
                            summary={summary}
                            score={match.similarity_score}
                        />
                    </div>
                ) : (
                    <p className="match-card-no-summary">
                        No AI eligibility summary — click "Find Matching Trials" to generate one.
                    </p>
                )
            }

            {/* ── AI Plain Language Summary ── */}
            <TrialSummaryCard
                trial={match.trial}
                summary={null}
            />

        </div >
    );
}