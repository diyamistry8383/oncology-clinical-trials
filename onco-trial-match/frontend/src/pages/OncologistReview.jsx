import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { getReviewQueue, recordMatchDecision } from "../api/client.js";
import SimilarityGauge from "../components/SimilarityGauge.jsx";

const ACTIONS = [
    { value: "approved", label: "✅ Approve", color: "#10B981", bg: "#ECFDF5" },
    { value: "rejected", label: "❌ Reject", color: "#EF4444", bg: "#FEF2F2" },
    { value: "referred", label: "📤 Refer", color: "#F59E0B", bg: "#FFFBEB" },
    { value: "enrolled", label: "🏥 Mark Enrolled", color: "#6366F1", bg: "#EEF2FF" },
];

export default function OncologistReview() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeMatchId, setActiveMatchId] = useState(null);
    const [notesDraft, setNotesDraft] = useState("");
    const [submittingAction, setSubmittingAction] = useState(null);

    useEffect(() => { loadQueue(); }, []);

    async function loadQueue() {
        setLoading(true);
        try {
            const data = await getReviewQueue({ limit: 100 });
            setQueue(data);
            setError(null);
        } catch {
            setError("Couldn't load the review queue.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDecision(matchId, action) {
        setSubmittingAction(`${matchId}:${action}`);
        try {
            await recordMatchDecision(matchId, { action, notes: notesDraft || null });
            setActiveMatchId(null);
            setNotesDraft("");
            await loadQueue();
        } catch {
            setError("Couldn't record that decision. Try again.");
        } finally {
            setSubmittingAction(null);
        }
    }

    if (loading) return (
        <Layout title="Oncologist Review">
            <p className="loading-text">⏳ Loading review queue…</p>
        </Layout>
    );

    return (
        <Layout title="Oncologist Review">

            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">👨‍⚕️ Oncologist Review Queue</h1>
                <p className="page-subtitle">
                    Review AI-matched trials and approve, reject, or refer patients.
                </p>
            </div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ marginBottom: 28 }}>
                <div className="stat-card">
                    <div className="stat-icon amber">📋</div>
                    <div>
                        <div className="stat-value">{queue.length}</div>
                        <div className="stat-label">Pending Review</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">✅</div>
                    <div>
                        <div className="stat-value">
                            {queue.filter(m => m.status === "approved").length}
                        </div>
                        <div className="stat-label">Approved</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">📤</div>
                    <div>
                        <div className="stat-value">
                            {queue.filter(m => m.status === "referred").length}
                        </div>
                        <div className="stat-label">Referred</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon cyan">🏥</div>
                    <div>
                        <div className="stat-value">
                            {queue.filter(m => m.status === "enrolled").length}
                        </div>
                        <div className="stat-label">Enrolled</div>
                    </div>
                </div>
            </div>

            {error && <div className="error-banner">⚠️ {error}</div>}

            {queue.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">✅</div>
                    <p className="empty-state-title">Queue is empty</p>
                    <p className="empty-state-body">
                        Every match has been reviewed. New matches appear here
                        as they are created.
                    </p>
                </div>
            ) : (
                <div className="match-list">
                    {queue.map((match) => (
                        <div key={match.id} className="card match-card">

                            {/* Match Header */}
                            <div className="match-card-header">
                                <div style={{ flex: 1 }}>
                                    <div
                                        className="match-card-title"
                                        style={{ cursor: "default", fontSize: 15 }}
                                    >
                                        {match.trial.title}
                                    </div>
                                    <div
                                        className="match-card-meta"
                                        style={{ display: "flex", gap: 8, marginTop: 6 }}
                                    >
                                        <span className="badge badge-info">
                                            {match.trial.nct_id}
                                        </span>
                                        <span className="badge badge-gray">
                                            Patient: {match.patient_id.slice(0, 8)}…
                                        </span>
                                        {match.trial.phase && (
                                            <span className="badge badge-purple">
                                                {match.trial.phase}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Current Status */}
                                <span className={`badge ${match.status === "approved" ? "badge-success" :
                                        match.status === "rejected" ? "badge-danger" :
                                            match.status === "enrolled" ? "badge-info" :
                                                match.status === "referred" ? "badge-warning" :
                                                    "badge-gray"
                                    }`}>
                                    {match.status || "pending"}
                                </span>
                            </div>

                            {/* Similarity Score */}
                            <SimilarityGauge score={match.similarity_score} />

                            {/* AI Summary */}
                            {match.llm_summary && (
                                <p
                                    className="match-card-summary-text"
                                    style={{ marginTop: 12 }}
                                >
                                    {match.llm_summary.summary_text}
                                </p>
                            )}

                            {/* Review Panel */}
                            {activeMatchId === match.id ? (
                                <div style={{
                                    marginTop: 16,
                                    padding: 16,
                                    background: "#F8FAFF",
                                    borderRadius: 12,
                                    border: "1px solid #E2E8F0",
                                }}>
                                    <div style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "#374151",
                                        marginBottom: 10,
                                    }}>
                                        📝 Add notes (optional)
                                    </div>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Notes for this decision…"
                                        value={notesDraft}
                                        onChange={(e) => setNotesDraft(e.target.value)}
                                        style={{ marginBottom: 12 }}
                                    />

                                    <div style={{
                                        display: "flex",
                                        gap: 8,
                                        flexWrap: "wrap",
                                    }}>
                                        {ACTIONS.map((a) => (
                                            <button
                                                key={a.value}
                                                disabled={submittingAction === `${match.id}:${a.value}`}
                                                onClick={() => handleDecision(match.id, a.value)}
                                                style={{
                                                    padding: "8px 16px",
                                                    borderRadius: 8,
                                                    border: `1.5px solid ${a.color}`,
                                                    background: a.bg,
                                                    color: a.color,
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    fontFamily: "Inter, sans-serif",
                                                    opacity: submittingAction === `${match.id}:${a.value}` ? 0.6 : 1,
                                                    transition: "all 0.2s",
                                                }}
                                            >
                                                {submittingAction === `${match.id}:${a.value}`
                                                    ? "⏳ Saving…"
                                                    : a.label}
                                            </button>
                                        ))}
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => {
                                                setActiveMatchId(null);
                                                setNotesDraft("");
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    className="btn btn-primary btn-sm"
                                    style={{ marginTop: 14, width: "fit-content" }}
                                    onClick={() => setActiveMatchId(match.id)}
                                >
                                    👨‍⚕️ Review this match
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

        </Layout>
    );
}