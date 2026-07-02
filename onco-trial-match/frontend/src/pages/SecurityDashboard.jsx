// src/pages/SecurityDashboard.jsx
import React, { useState } from "react";
import Layout from "../components/Layout";

// ── Fake audit log data ─────────────────────────────────────
const AUDIT_LOGS = [
    { id: 1, time: "2026-06-28 14:32:01", user: "Dr. Diya", role: "Doctor", action: "VIEW", resource: "Patient Profile — Diya Patel", ip: "192.168.1.47", status: "success" },
    { id: 2, time: "2026-06-28 14:28:45", user: "Dr. Diya", role: "Doctor", action: "MATCH", resource: "AI Matching — Synthea Patient 001", ip: "192.168.1.47", status: "success" },
    { id: 3, time: "2026-06-28 14:15:22", user: "Admin", role: "Admin", action: "DELETE", resource: "Patient Record — Test Patient", ip: "192.168.1.1", status: "success" },
    { id: 4, time: "2026-06-28 13:58:10", user: "Researcher01", role: "Researcher", action: "EXPORT", resource: "Analytics Dashboard Export", ip: "10.0.0.5", status: "success" },
    { id: 5, time: "2026-06-28 13:45:33", user: "Unknown", role: "—", action: "LOGIN", resource: "Login Attempt", ip: "203.0.113.42", status: "failed" },
    { id: 6, time: "2026-06-28 13:30:19", user: "Dr. Diya", role: "Doctor", action: "REVIEW", resource: "Oncologist Review — NCT04857502", ip: "192.168.1.47", status: "success" },
    { id: 7, time: "2026-06-28 13:12:05", user: "Admin", role: "Admin", action: "CREATE", resource: "New User — Researcher01", ip: "192.168.1.1", status: "success" },
    { id: 8, time: "2026-06-28 12:55:41", user: "Patient01", role: "Patient", action: "VIEW", resource: "Own Trial Matches", ip: "172.16.0.8", status: "success" },
];

const ROLES = [
    {
        name: "Admin",
        icon: "👑",
        color: "#EF4444",
        bg: "#FEF2F2",
        count: 1,
        permissions: [
            "View all patients",
            "Create / delete users",
            "Access audit logs",
            "Manage system settings",
            "View all analytics",
            "Export data",
        ],
    },
    {
        name: "Doctor",
        icon: "👨‍⚕️",
        color: "#6366F1",
        bg: "#EEF2FF",
        count: 3,
        permissions: [
            "View assigned patients",
            "Run AI matching",
            "Review & approve trials",
            "View match summaries",
            "Access biomarker data",
        ],
        denied: ["Delete patients", "Export raw data", "Manage users"],
    },
    {
        name: "Researcher",
        icon: "🔬",
        color: "#06B6D4",
        bg: "#ECFEFF",
        count: 2,
        permissions: [
            "View aggregate analytics",
            "Access anonymised data",
            "Export summary reports",
            "View trial statistics",
        ],
        denied: ["View PII / patient names", "Run AI matching", "Approve trials"],
    },
    {
        name: "Patient",
        icon: "🧑",
        color: "#10B981",
        bg: "#ECFDF5",
        count: 10,
        permissions: [
            "View own profile",
            "View own trial matches",
            "Download own data",
            "Request data deletion",
        ],
        denied: ["View other patients", "Run AI matching", "Access analytics"],
    },
];

const SECURITY_CHECKS = [
    { label: "JWT Authentication", status: "active", icon: "🔑", detail: "HS256 tokens · 30 min expiry · refresh enabled" },
    { label: "Password Hashing (bcrypt)", status: "active", icon: "🔐", detail: "bcrypt rounds: 12 · salted hashes · no plaintext" },
    { label: "AES-256 Data Encryption", status: "active", icon: "🛡️", detail: "PHI fields encrypted at rest · TLS 1.3 in transit" },
    { label: "Role-Based Access Control", status: "active", icon: "👥", detail: "4 roles · scoped permissions · enforced per endpoint" },
    { label: "Rate Limiting (SlowAPI)", status: "active", icon: "⏱️", detail: "100 req/min per user · 429 on exceed" },
    { label: "CORS Protection", status: "active", icon: "🌐", detail: "Whitelist: localhost:5173, production domain" },
    { label: "SQL Injection Prevention", status: "active", icon: "💉", detail: "SQLAlchemy ORM · parameterised queries only" },
    { label: "XSS Prevention (bleach)", status: "active", icon: "🧹", detail: "Input sanitised with bleach before DB write" },
    { label: "HIPAA Audit Logging", status: "active", icon: "📋", detail: "All PHI access logged with user, IP, timestamp" },
    { label: "2FA / MFA", status: "planned", icon: "📱", detail: "Planned for v2 — TOTP support" },
    { label: "End-to-end Encryption", status: "planned", icon: "🔒", detail: "Planned for v2 — client-side encryption" },
];

// ── Sub-components ──────────────────────────────────────────
function SecurityBadge({ status }) {
    const cfg = status === "active"
        ? { label: "✅ Active", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" }
        : { label: "🔜 Planned", color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" };
    return (
        <span style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 20,
            background: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.border}`,
        }}>
            {cfg.label}
        </span>
    );
}

function ActionBadge({ action }) {
    const cfg = {
        VIEW: { color: "#1D4ED8", bg: "#EFF6FF" },
        MATCH: { color: "#6366F1", bg: "#EEF2FF" },
        DELETE: { color: "#DC2626", bg: "#FEF2F2" },
        EXPORT: { color: "#D97706", bg: "#FFFBEB" },
        LOGIN: { color: "#64748B", bg: "#F1F5F9" },
        REVIEW: { color: "#059669", bg: "#ECFDF5" },
        CREATE: { color: "#7C3AED", bg: "#F5F3FF" },
    };
    const c = cfg[action] || { color: "#64748B", bg: "#F1F5F9" };
    return (
        <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 4,
            background: c.bg,
            color: c.color,
            letterSpacing: "0.04em",
        }}>
            {action}
        </span>
    );
}

// ── Main page ───────────────────────────────────────────────
export default function SecurityDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [filterRole, setFilterRole] = useState("All");

    const filteredLogs = filterRole === "All"
        ? AUDIT_LOGS
        : AUDIT_LOGS.filter(l => l.role === filterRole);

    const tabs = [
        { id: "overview", label: "🛡️ Security Overview" },
        { id: "rbac", label: "👥 Role-Based Access" },
        { id: "audit", label: "📋 Audit Logs" },
        { id: "privacy", label: "🔒 Privacy Dashboard" },
    ];

    return (
        <Layout title="Security & Privacy">

            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">🔒 Security & Privacy Dashboard</h1>
                <p className="page-subtitle">
                    HIPAA-style monitoring · access control · data protection status
                </p>
            </div>

            {/* Security score banner */}
            <div style={{
                background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)",
                borderRadius: 16,
                padding: "20px 28px",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 24,
            }}>
                <div style={{
                    width: 72,
                    height: 72,
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    flexShrink: 0,
                }}>
                    🛡️
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.6)",
                        marginBottom: 4,
                        fontWeight: 500,
                    }}>
                        Platform Security Score
                    </div>
                    <div style={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: "#4ADE80",
                        lineHeight: 1,
                        marginBottom: 8,
                    }}>
                        9 / 11 <span style={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }}>checks passed</span>
                    </div>
                    <div style={{
                        width: "100%",
                        height: 8,
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: 4,
                        overflow: "hidden",
                    }}>
                        <div style={{
                            width: "82%",
                            height: "100%",
                            background: "linear-gradient(90deg, #4ADE80, #22D3EE)",
                            borderRadius: 4,
                        }} />
                    </div>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                    {[
                        { label: "Active", value: 9, color: "#4ADE80" },
                        { label: "Planned", value: 2, color: "#FCD34D" },
                        { label: "Failed", value: 0, color: "#F87171" },
                    ].map((s, i) => (
                        <div key={i} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: "flex",
                gap: 4,
                marginBottom: 24,
                background: "#F1F5F9",
                padding: 4,
                borderRadius: 12,
                width: "fit-content",
            }}>
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        style={{
                            padding: "9px 18px",
                            border: "none",
                            borderRadius: 9,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: "Inter, sans-serif",
                            transition: "all 0.2s",
                            background: activeTab === t.id
                                ? "linear-gradient(135deg, #1E1B4B, #312E81)"
                                : "transparent",
                            color: activeTab === t.id ? "#FFFFFF" : "#64748B",
                            boxShadow: activeTab === t.id
                                ? "0 2px 8px rgba(30,27,75,0.35)"
                                : "none",
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB 1: Security Overview ── */}
            {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {SECURITY_CHECKS.map((check, i) => (
                        <div key={i} style={{
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: 12,
                            padding: "16px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        }}>
                            <div style={{
                                width: 42,
                                height: 42,
                                background: check.status === "active" ? "#ECFDF5" : "#FEF3C7",
                                borderRadius: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 20,
                                flexShrink: 0,
                            }}>
                                {check.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#1E293B",
                                    marginBottom: 3,
                                }}>
                                    {check.label}
                                </div>
                                <div style={{ fontSize: 12, color: "#64748B" }}>
                                    {check.detail}
                                </div>
                            </div>
                            <SecurityBadge status={check.status} />
                        </div>
                    ))}
                </div>
            )}

            {/* ── TAB 2: RBAC ── */}
            {activeTab === "rbac" && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                }}>
                    {ROLES.map((role, i) => (
                        <div key={i} style={{
                            background: "#FFFFFF",
                            border: `2px solid ${role.color}22`,
                            borderRadius: 16,
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}>
                            {/* Role header */}
                            <div style={{
                                background: role.bg,
                                padding: "16px 20px",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                borderBottom: `1px solid ${role.color}22`,
                            }}>
                                <div style={{
                                    width: 46,
                                    height: 46,
                                    background: "#FFFFFF",
                                    borderRadius: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 22,
                                    boxShadow: `0 2px 8px ${role.color}33`,
                                }}>
                                    {role.icon}
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: 16,
                                        fontWeight: 800,
                                        color: role.color,
                                    }}>
                                        {role.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#64748B" }}>
                                        {role.count} user{role.count > 1 ? "s" : ""} assigned
                                    </div>
                                </div>
                                <span style={{
                                    marginLeft: "auto",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: "3px 10px",
                                    borderRadius: 20,
                                    background: "#FFFFFF",
                                    color: role.color,
                                    border: `1px solid ${role.color}44`,
                                }}>
                                    {role.permissions.length} permissions
                                </span>
                            </div>

                            {/* Permissions */}
                            <div style={{ padding: "14px 20px" }}>
                                <div style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#94A3B8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    marginBottom: 8,
                                }}>
                                    ✅ Allowed
                                </div>
                                {role.permissions.map((p, j) => (
                                    <div key={j} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "5px 0",
                                        fontSize: 13,
                                        color: "#374151",
                                        borderBottom: "1px solid #F8FAFF",
                                    }}>
                                        <span style={{ color: "#10B981", fontSize: 12 }}>✓</span>
                                        {p}
                                    </div>
                                ))}

                                {role.denied && (
                                    <>
                                        <div style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: "#94A3B8",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                            margin: "12px 0 8px",
                                        }}>
                                            ❌ Denied
                                        </div>
                                        {role.denied.map((p, j) => (
                                            <div key={j} style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                padding: "5px 0",
                                                fontSize: 13,
                                                color: "#94A3B8",
                                                borderBottom: "1px solid #F8FAFF",
                                            }}>
                                                <span style={{ color: "#EF4444", fontSize: 12 }}>✗</span>
                                                {p}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── TAB 3: Audit Logs ── */}
            {activeTab === "audit" && (
                <div>
                    {/* Filter bar */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 16,
                        padding: "12px 16px",
                        background: "#F8FAFF",
                        borderRadius: 10,
                        border: "1px solid #E2E8F0",
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                            Filter by role:
                        </span>
                        {["All", "Admin", "Doctor", "Researcher", "Patient"].map(r => (
                            <button
                                key={r}
                                onClick={() => setFilterRole(r)}
                                style={{
                                    padding: "5px 14px",
                                    borderRadius: 8,
                                    border: "1px solid #E2E8F0",
                                    background: filterRole === r ? "#1E1B4B" : "#FFFFFF",
                                    color: filterRole === r ? "#FFFFFF" : "#374151",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontFamily: "Inter, sans-serif",
                                    transition: "all 0.15s",
                                }}
                            >
                                {r}
                            </button>
                        ))}
                        <span style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            color: "#64748B",
                        }}>
                            {filteredLogs.length} events
                        </span>
                    </div>

                    {/* Audit table */}
                    <div style={{
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: 14,
                        overflow: "hidden",
                    }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                    <th>Resource</th>
                                    <th>IP Address</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id}>
                                        <td style={{
                                            fontSize: 11,
                                            color: "#64748B",
                                            fontFamily: "monospace",
                                            whiteSpace: "nowrap",
                                        }}>
                                            {log.time}
                                        </td>
                                        <td style={{ fontWeight: 600, fontSize: 13 }}>
                                            {log.user}
                                        </td>
                                        <td>
                                            <span style={{
                                                fontSize: 11,
                                                padding: "2px 8px",
                                                borderRadius: 4,
                                                background: "#F1F5F9",
                                                color: "#475569",
                                                fontWeight: 500,
                                            }}>
                                                {log.role}
                                            </span>
                                        </td>
                                        <td>
                                            <ActionBadge action={log.action} />
                                        </td>
                                        <td style={{ fontSize: 12.5, color: "#374151" }}>
                                            {log.resource}
                                        </td>
                                        <td style={{
                                            fontSize: 11,
                                            color: "#64748B",
                                            fontFamily: "monospace",
                                        }}>
                                            {log.ip}
                                        </td>
                                        <td>
                                            <span style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                padding: "2px 8px",
                                                borderRadius: 20,
                                                background: log.status === "success" ? "#ECFDF5" : "#FEF2F2",
                                                color: log.status === "success" ? "#059669" : "#DC2626",
                                            }}>
                                                {log.status === "success" ? "✅ Success" : "❌ Failed"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── TAB 4: Privacy Dashboard ── */}
            {activeTab === "privacy" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Data protection status */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 14,
                    }}>
                        {[
                            { icon: "🔐", label: "Data Encrypted", value: "100%", sub: "All PHI fields AES-256", color: "#10B981", bg: "#ECFDF5" },
                            { icon: "📋", label: "Audit Coverage", value: "100%", sub: "Every PHI access logged", color: "#6366F1", bg: "#EEF2FF" },
                            { icon: "🌐", label: "TLS / HTTPS", value: "Active", sub: "TLS 1.3 enforced", color: "#06B6D4", bg: "#ECFEFF" },
                            { icon: "👤", label: "Data Minimisation", value: "Active", sub: "Only necessary data stored", color: "#8B5CF6", bg: "#F5F3FF" },
                            { icon: "🗑️", label: "Right to Delete", value: "Active", sub: "Patient data deletion API", color: "#F59E0B", bg: "#FFFBEB" },
                            { icon: "📤", label: "Data Portability", value: "Active", sub: "JSON export available", color: "#EC4899", bg: "#FDF2F8" },
                        ].map((item, i) => (
                            <div key={i} style={{
                                background: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                borderRadius: 14,
                                padding: "18px 20px",
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                            }}>
                                <div style={{
                                    width: 46,
                                    height: 46,
                                    background: item.bg,
                                    borderRadius: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 22,
                                    flexShrink: 0,
                                }}>
                                    {item.icon}
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: 18,
                                        fontWeight: 800,
                                        color: item.color,
                                        lineHeight: 1,
                                    }}>
                                        {item.value}
                                    </div>
                                    <div style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#1E293B",
                                        marginTop: 3,
                                    }}>
                                        {item.label}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                                        {item.sub}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Patient data rights */}
                    <div style={{
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: 16,
                        overflow: "hidden",
                    }}>
                        <div style={{
                            padding: "16px 20px",
                            borderBottom: "1px solid #F1F5F9",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}>
                            <span style={{ fontSize: 18 }}>🔏</span>
                            <span style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#1E293B",
                            }}>
                                Patient Data Rights (HIPAA-Style)
                            </span>
                        </div>
                        <div style={{ padding: "16px 20px" }}>
                            {[
                                { right: "Right to Access", desc: "Patients can view all their own data at any time", status: "✅ Implemented" },
                                { right: "Right to Correction", desc: "Patients can request corrections to their medical profile", status: "✅ Implemented" },
                                { right: "Right to Deletion", desc: "Patients can request complete deletion of their data", status: "✅ Implemented" },
                                { right: "Right to Portability", desc: "Patients can export their data in JSON format", status: "✅ Implemented" },
                                { right: "Right to Restrict Processing", desc: "Patients can opt out of AI matching", status: "🔜 Planned" },
                                { right: "Breach Notification", desc: "Automatic alerts within 72 hours of any data breach", status: "🔜 Planned" },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 14,
                                    padding: "12px 0",
                                    borderBottom: i < 5 ? "1px solid #F1F5F9" : "none",
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: "#1E293B",
                                            marginBottom: 3,
                                        }}>
                                            {item.right}
                                        </div>
                                        <div style={{ fontSize: 12, color: "#64748B" }}>
                                            {item.desc}
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: "3px 10px",
                                        borderRadius: 20,
                                        background: item.status.includes("✅") ? "#ECFDF5" : "#FEF3C7",
                                        color: item.status.includes("✅") ? "#059669" : "#92400E",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Encryption details */}
                    <div style={{
                        background: "linear-gradient(135deg, #1E1B4B, #312E81)",
                        borderRadius: 16,
                        padding: "20px 24px",
                        color: "#FFFFFF",
                    }}>
                        <div style={{
                            fontSize: 14,
                            fontWeight: 700,
                            marginBottom: 16,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}>
                            🔐 Encryption Details
                        </div>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 12,
                        }}>
                            {[
                                { label: "Algorithm", value: "AES-256-GCM" },
                                { label: "Key Management", value: "Environment vars" },
                                { label: "Transit", value: "TLS 1.3" },
                                { label: "Password Hash", value: "bcrypt (r=12)" },
                                { label: "JWT Secret", value: "HS256 / 256-bit" },
                                { label: "DB Connection", value: "SSL enforced" },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    background: "rgba(255,255,255,0.08)",
                                    borderRadius: 10,
                                    padding: "10px 14px",
                                }}>
                                    <div style={{
                                        fontSize: 10,
                                        color: "rgba(255,255,255,0.5)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        marginBottom: 4,
                                    }}>
                                        {item.label}
                                    </div>
                                    <div style={{
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: "#4ADE80",
                                        fontFamily: "monospace",
                                    }}>
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

        </Layout>
    );
}