// src/pages/AnalyticsDashboard.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from "recharts";
import { listPatients, getEnrollmentTracker } from "../api/client.js";

// ── Colour palette ──────────────────────────────────────────
const COLORS = ["#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];

const CANCER_COLORS = {
    "Breast Cancer": "#E91E8C",
    "Lung Cancer": "#1565C0",
    "Colorectal Cancer": "#2E7D32",
    "Prostate Cancer": "#3949AB",
    "Leukemia": "#B71C1C",
    "Lymphoma": "#6A1B9A",
    "Melanoma": "#4E342E",
    "Pancreatic Cancer": "#F57F17",
    "Ovarian Cancer": "#C62828",
    "Brain Tumors": "#37474F",
    "Other": "#78909C",
};

// ── Tiny helpers ────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = "#6366F1", bg = "#EEF2FF" }) {
    return (
        <div style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 16,
            padding: "20px 22px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 2px 8px rgba(99,102,241,0.07)",
        }}>
            <div style={{
                width: 52,
                height: 52,
                background: bg,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexShrink: 0,
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>
                    {value}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", marginTop: 3 }}>
                    {label}
                </div>
                {sub && (
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{sub}</div>
                )}
            </div>
        </div>
    );
}

function ChartCard({ title, icon, children, height = 280 }) {
    return (
        <div style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(99,102,241,0.07)",
        }}>
            <div style={{
                padding: "16px 20px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                gap: 8,
            }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{title}</span>
            </div>
            <div style={{ padding: "16px 12px", height }}>
                {children}
            </div>
        </div>
    );
}

// ── Fake monthly trend data ─────────────────────────────────
const MONTHLY = [
    { month: "Jan", patients: 4, matches: 18, enrolled: 2 },
    { month: "Feb", patients: 6, matches: 27, enrolled: 3 },
    { month: "Mar", patients: 5, matches: 22, enrolled: 4 },
    { month: "Apr", patients: 9, matches: 41, enrolled: 6 },
    { month: "May", patients: 11, matches: 53, enrolled: 7 },
    { month: "Jun", patients: 8, matches: 38, enrolled: 5 },
];

const AI_PERF = [
    { week: "W1", accuracy: 78, matches: 12 },
    { week: "W2", accuracy: 82, matches: 19 },
    { week: "W3", accuracy: 85, matches: 24 },
    { week: "W4", accuracy: 88, matches: 31 },
    { week: "W5", accuracy: 91, matches: 28 },
    { week: "W6", accuracy: 89, matches: 35 },
];

// ── Main Component ──────────────────────────────────────────
export default function AnalyticsDashboard() {
    const [patients, setPatients] = useState([]);
    const [enrollment, setEnrollment] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [p, e] = await Promise.all([
                    listPatients({ limit: 200 }),
                    getEnrollmentTracker(),
                ]);
                setPatients(p);
                setEnrollment(e);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return (
        <Layout title="Analytics Dashboard">
            <p className="loading-text">⏳ Loading analytics…</p>
        </Layout>
    );

    // ── Derived stats ──────────────────────────────────────────
    const totalPatients = patients.length;
    const totalMatches = enrollment.reduce((s, r) => s + r.total_matches, 0);
    const totalEnrolled = enrollment.reduce((s, r) => s + r.enrolled_count, 0);
    const totalApproved = enrollment.reduce((s, r) => s + r.approved_count, 0);
    const totalPending = enrollment.reduce((s, r) => s + r.pending_count, 0);

    const avgScore = enrollment.length
        ? Math.round(
            enrollment.reduce((s, r) => s + (r.total_matches > 0 ? (r.approved_count / r.total_matches) * 100 : 0), 0) /
            enrollment.length
        )
        : 0;

    // Cancer type distribution
    const cancerMap = {};
    patients.forEach(p => {
        const key = p.cancer_type || "Other";
        cancerMap[key] = (cancerMap[key] || 0) + 1;
    });
    const cancerData = Object.entries(cancerMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Trial status breakdown
    const statusData = [
        { name: "Pending", value: totalPending, color: "#F59E0B" },
        { name: "Approved", value: totalApproved, color: "#10B981" },
        { name: "Enrolled", value: totalEnrolled, color: "#6366F1" },
        { name: "Rejected", value: enrollment.reduce((s, r) => s + r.rejected_count, 0), color: "#EF4444" },
        { name: "Referred", value: enrollment.reduce((s, r) => s + r.referred_count, 0), color: "#06B6D4" },
    ].filter(d => d.value > 0);

    // Sex distribution
    const sexData = [
        { name: "Female", value: patients.filter(p => p.sex === "FEMALE").length, color: "#EC4899" },
        { name: "Male", value: patients.filter(p => p.sex === "MALE").length, color: "#6366F1" },
        { name: "Other", value: patients.filter(p => p.sex === "ALL").length, color: "#94A3B8" },
    ].filter(d => d.value > 0);

    // Top 6 cancer types for bar chart
    const topCancers = cancerData.slice(0, 6).map(d => ({
        ...d,
        fill: CANCER_COLORS[d.name] || "#78909C",
    }));

    // Biomarker frequency
    const biomarkerMap = {};
    patients.forEach(p => {
        (p.biomarkers || []).forEach(b => {
            biomarkerMap[b] = (biomarkerMap[b] || 0) + 1;
        });
    });
    const biomarkerData = Object.entries(biomarkerMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    // Per-patient match scores for bar chart
    const matchScoreData = enrollment.slice(0, 8).map(r => ({
        name: r.patient_name?.split(" ")[0] || "P",
        score: r.total_matches > 0
            ? Math.round((r.approved_count / r.total_matches) * 100)
            : 0,
        matches: r.total_matches,
    }));

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div style={{
                background: "#1E293B",
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                color: "#FFFFFF",
            }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
                {payload.map((p, i) => (
                    <div key={i} style={{ color: p.color || "#FFFFFF" }}>
                        {p.name}: {p.value}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Layout title="Analytics Dashboard">

            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">📊 Analytics Dashboard</h1>
                <p className="page-subtitle">
                    Real-time insights across patients, trials, and AI performance
                </p>
            </div>

            {/* ── KPI Stats Row ── */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 14,
                marginBottom: 24,
            }}>
                <StatCard icon="👥" label="Total Patients" value={totalPatients} color="#6366F1" bg="#EEF2FF" />
                <StatCard icon="🎯" label="Total Matches" value={totalMatches} color="#06B6D4" bg="#ECFEFF" />
                <StatCard icon="✅" label="Approved" value={totalApproved} color="#10B981" bg="#ECFDF5" />
                <StatCard icon="🏥" label="Enrolled" value={totalEnrolled} color="#8B5CF6" bg="#F5F3FF" />
                <StatCard icon="⏳" label="Pending Review" value={totalPending} color="#F59E0B" bg="#FFFBEB" />
                <StatCard icon="🤖" label="Avg Match Score" value={`${avgScore}%`} color="#EC4899" bg="#FDF2F8"
                    sub="AI eligibility score" />
            </div>

            {/* ── Row 1: Cancer Distribution + Status Pie ── */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
            }}>

                {/* Cancer Type Bar Chart */}
                <ChartCard icon="🧬" title="Cancer Type Distribution" height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topCancers} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10, fill: "#64748B" }}
                                angle={-35}
                                textAnchor="end"
                                interval={0}
                            />
                            <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Patients">
                                {topCancers.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Trial Status Pie */}
                <ChartCard icon="📋" title="Trial Status Overview" height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="45%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {statusData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name) => [value, name]}
                                contentStyle={{
                                    background: "#1E293B",
                                    border: "none",
                                    borderRadius: 8,
                                    color: "#FFFFFF",
                                    fontSize: 12,
                                }}
                            />
                            <Legend
                                iconType="circle"
                                iconSize={10}
                                formatter={(value) => (
                                    <span style={{ fontSize: 12, color: "#374151" }}>{value}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* ── Row 2: Monthly Trends + Sex Distribution ── */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 16,
                marginBottom: 16,
            }}>

                {/* Monthly Trend Area Chart */}
                <ChartCard icon="📈" title="Monthly Matching Trends" height={260}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MONTHLY} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradPatients" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradMatches" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradEnrolled" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                formatter={(v) => (
                                    <span style={{ fontSize: 11, color: "#374151" }}>{v}</span>
                                )}
                            />
                            <Area type="monotone" dataKey="patients" name="Patients"
                                stroke="#6366F1" fill="url(#gradPatients)" strokeWidth={2} dot={{ r: 3 }} />
                            <Area type="monotone" dataKey="matches" name="Matches"
                                stroke="#06B6D4" fill="url(#gradMatches)" strokeWidth={2} dot={{ r: 3 }} />
                            <Area type="monotone" dataKey="enrolled" name="Enrolled"
                                stroke="#10B981" fill="url(#gradEnrolled)" strokeWidth={2} dot={{ r: 3 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Sex Distribution Pie */}
                <ChartCard icon="👥" title="Patient Demographics" height={260}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sexData}
                                cx="50%"
                                cy="45%"
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                }
                                labelLine={false}
                            >
                                {sexData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: "#1E293B",
                                    border: "none",
                                    borderRadius: 8,
                                    color: "#FFFFFF",
                                    fontSize: 12,
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* ── Row 3: Biomarker Stats + AI Performance ── */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
            }}>

                {/* Biomarker Frequency */}
                <ChartCard icon="🔬" title="Biomarker Statistics" height={280}>
                    {biomarkerData.length === 0 ? (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            color: "#94A3B8",
                            fontSize: 13,
                        }}>
                            No biomarker data yet
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={biomarkerData}
                                layout="vertical"
                                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: "#374151" }}
                                    width={60}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Patients" radius={[0, 6, 6, 0]}>
                                    {biomarkerData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* AI Performance */}
                <ChartCard icon="🤖" title="AI Performance Metrics" height={280}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={AI_PERF} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748B" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                formatter={(v) => (
                                    <span style={{ fontSize: 11, color: "#374151" }}>{v}</span>
                                )}
                            />
                            <Line
                                type="monotone"
                                dataKey="accuracy"
                                name="Accuracy %"
                                stroke="#6366F1"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: "#6366F1" }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="matches"
                                name="Matches"
                                stroke="#10B981"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: "#10B981" }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* ── Row 4: Match Score per Patient ── */}
            {matchScoreData.length > 0 && (
                <ChartCard icon="🎯" title="Match Score Analytics — Per Patient" height={260}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={matchScoreData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                formatter={(v) => (
                                    <span style={{ fontSize: 11, color: "#374151" }}>{v}</span>
                                )}
                            />
                            <Bar dataKey="score" name="Score %" fill="#6366F1" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="matches" name="Matches" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            )}

            {/* ── Row 5: Patient Progress Tracking Table ── */}
            <div style={{ marginTop: 16 }}>
                <div style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(99,102,241,0.07)",
                }}>
                    <div style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid #F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}>
                        <span style={{ fontSize: 18 }}>📋</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>
                            Patient Progress Tracking
                        </span>
                        <span style={{
                            marginLeft: "auto",
                            fontSize: 11,
                            padding: "2px 10px",
                            borderRadius: 20,
                            background: "#EEF2FF",
                            color: "#6366F1",
                            fontWeight: 600,
                        }}>
                            {enrollment.length} patients
                        </span>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
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
                            {enrollment.map((row) => {
                                const done = row.approved_count + row.enrolled_count +
                                    row.rejected_count + row.referred_count;
                                const pct = row.total_matches > 0
                                    ? Math.round((done / row.total_matches) * 100)
                                    : 0;
                                return (
                                    <tr key={row.patient_id}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{
                                                    width: 30,
                                                    height: 30,
                                                    background: "linear-gradient(135deg, #6366F1, #06B6D4)",
                                                    borderRadius: "50%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#fff",
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                }}>
                                                    {row.patient_name?.[0]?.toUpperCase() || "P"}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: 13 }}>
                                                    {row.patient_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            {row.pending_count > 0
                                                ? <span className="badge badge-warning">{row.pending_count}</span>
                                                : <span style={{ color: "#CBD5E1" }}>—</span>}
                                        </td>
                                        <td>
                                            {row.approved_count > 0
                                                ? <span className="badge badge-success">{row.approved_count}</span>
                                                : <span style={{ color: "#CBD5E1" }}>—</span>}
                                        </td>
                                        <td>
                                            {row.rejected_count > 0
                                                ? <span className="badge badge-danger">{row.rejected_count}</span>
                                                : <span style={{ color: "#CBD5E1" }}>—</span>}
                                        </td>
                                        <td>
                                            {row.referred_count > 0
                                                ? <span className="badge badge-info">{row.referred_count}</span>
                                                : <span style={{ color: "#CBD5E1" }}>—</span>}
                                        </td>
                                        <td>
                                            {row.enrolled_count > 0
                                                ? <span className="badge badge-purple">{row.enrolled_count}</span>
                                                : <span style={{ color: "#CBD5E1" }}>—</span>}
                                        </td>
                                        <td>
                                            <strong style={{ color: "#1E293B" }}>{row.total_matches}</strong>
                                        </td>
                                        <td style={{ minWidth: 120 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                                                            ? "linear-gradient(90deg,#10B981,#059669)"
                                                            : "linear-gradient(90deg,#6366F1,#06B6D4)",
                                                        borderRadius: 3,
                                                        transition: "width 0.4s",
                                                    }} />
                                                </div>
                                                <span style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: "#64748B",
                                                    minWidth: 30,
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
            </div>

        </Layout>
    );
}