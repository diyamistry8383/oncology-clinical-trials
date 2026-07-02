import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEnrollmentTracker } from "../api/client.js";

export default function EnrollmentTracker() {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await getEnrollmentTracker();
            setRows(data);
            setError(null);
        } catch {
            setError("Couldn't load the enrollment tracker.");
        } finally {
            setLoading(false);
        }
    }

    // Calculate totals for stats
    const totalPending = rows.reduce((s, r) => s + r.pending_count, 0);
    const totalApproved = rows.reduce((s, r) => s + r.approved_count, 0);
    const totalEnrolled = rows.reduce((s, r) => s + r.enrolled_count, 0);
    const totalMatches = rows.reduce((s, r) => s + r.total_matches, 0);

    if (loading) return (
        <Layout title="Enrollment Tracker">
            <p className="loading-text">⏳ Loading enrollment data…</p>
        </Layout>
    );

    return (
        <Layout title="Enrollment Tracker">

            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">📊 Enrollment Tracker</h1>
                <p className="page-subtitle">
                    Track match status and enrollment progress across all patients.
                </p>
            </div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ marginBottom: 28 }}>
                <div className="stat-card">
                    <div className="stat-icon purple">👥</div>
                    <div>
                        <div className="stat-value">{rows.length}</div>
                        <div className="stat-label">Total Patients</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon cyan">🎯</div>
                    <div>
                        <div className="stat-value">{totalMatches}</div>
                        <div className="stat-label">Total Matches</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon amber">⏳</div>
                    <div>
                        <div className="stat-value">{totalPending}</div>
                        <div className="stat-label">Pending Review</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">✅</div>
                    <div>
                        <div className="stat-value">{totalApproved}</div>
                        <div className="stat-label">Approved</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon cyan">🏥</div>
                    <div>
                        <div className="stat-value">{totalEnrolled}</div>
                        <div className="stat-label">Enrolled</div>
                    </div>
                </div>
            </div>

            {error && <div className="error-banner">⚠️ {error}</div>}

            {rows.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">📊</div>
                    <p className="empty-state-title">No matches yet</p>
                    <p className="empty-state-body">
                        Once patients are matched to trials, their status
                        breakdown shows up here.
                    </p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <div className="card-header">
                        <div className="card-title">
                            📋 Patient Enrollment Status
                        </div>
                        <span className="badge badge-purple">
                            {rows.length} patients
                        </span>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Patient Name</th>
                                <th>⏳ Pending</th>
                                <th>✅ Approved</th>
                                <th>❌ Rejected</th>
                                <th>📤 Referred</th>
                                <th>🏥 Enrolled</th>
                                <th>Total</th>
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const done = row.approved_count +
                                    row.enrolled_count +
                                    row.rejected_count +
                                    row.referred_count;
                                const pct = row.total_matches > 0
                                    ? Math.round((done / row.total_matches) * 100)
                                    : 0;

                                return (
                                    <tr
                                        key={row.patient_id}
                                        onClick={() => navigate(`/patients/${row.patient_id}/matches`)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                            }}>
                                                <div style={{
                                                    width: 32,
                                                    height: 32,
                                                    background: "linear-gradient(135deg, #6366F1, #06B6D4)",
                                                    borderRadius: "50%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#fff",
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                }}>
                                                    {row.patient_name?.[0]?.toUpperCase() || "P"}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>
                                                    {row.patient_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            {row.pending_count > 0 ? (
                                                <span className="badge badge-warning">
                                                    {row.pending_count}
                                                </span>
                                            ) : (
                                                <span style={{ color: "#CBD5E1" }}>0</span>
                                            )}
                                        </td>
                                        <td>
                                            {row.approved_count > 0 ? (
                                                <span className="badge badge-success">
                                                    {row.approved_count}
                                                </span>
                                            ) : (
                                                <span style={{ color: "#CBD5E1" }}>0</span>
                                            )}
                                        </td>
                                        <td>
                                            {row.rejected_count > 0 ? (
                                                <span className="badge badge-danger">
                                                    {row.rejected_count}
                                                </span>
                                            ) : (
                                                <span style={{ color: "#CBD5E1" }}>0</span>
                                            )}
                                        </td>
                                        <td>
                                            {row.referred_count > 0 ? (
                                                <span className="badge badge-info">
                                                    {row.referred_count}
                                                </span>
                                            ) : (
                                                <span style={{ color: "#CBD5E1" }}>0</span>
                                            )}
                                        </td>
                                        <td>
                                            {row.enrolled_count > 0 ? (
                                                <span className="badge badge-purple">
                                                    {row.enrolled_count}
                                                </span>
                                            ) : (
                                                <span style={{ color: "#CBD5E1" }}>0</span>
                                            )}
                                        </td>
                                        <td>
                                            <strong style={{ color: "#1E293B" }}>
                                                {row.total_matches}
                                            </strong>
                                        </td>
                                        <td style={{ minWidth: 120 }}>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}>
                                                <div style={{
                                                    flex: 1,
                                                    height: 6,
                                                    background: "#F1F5F9",
                                                    borderRadius: 3,
                                                    overflow: "hidden",
                                                }}>
                                                    <div style={{
                                                        width: `${pct}%`,
                                                        height: "100%",
                                                        background: pct === 100
                                                            ? "linear-gradient(90deg, #10B981, #059669)"
                                                            : "linear-gradient(90deg, #6366F1, #06B6D4)",
                                                        borderRadius: 3,
                                                        transition: "width 0.3s",
                                                    }} />
                                                </div>
                                                <span style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: "#64748B",
                                                    minWidth: 32,
                                                }}>
                                                    {pct}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

        </Layout>
    );
}