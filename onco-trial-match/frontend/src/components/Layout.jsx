// src/components/Layout.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
    { icon: "👥", label: "Patients", path: "/", section: "MAIN" },
    { icon: "👨‍⚕️", label: "Oncologist Review", path: "/oncologist", section: "MAIN" },
    { icon: "📊", label: "Enrollment Tracker", path: "/enrollment", section: "ANALYTICS" },
];

export default function Layout({ children, title }) {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">🧬</div>
                    <div className="sidebar-logo-title">OncoTrialMatch</div>
                    <div className="sidebar-logo-sub">AI Clinical Trial Platform</div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Main Menu</div>
                    {NAV_ITEMS.filter(i => i.section === "MAIN").map(item => (
                        <button
                            key={item.path}
                            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="nav-item-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                    <div className="sidebar-section-label">Analytics</div>
                    <button
                        className={`nav-item ${location.pathname === "/analytics" ? "active" : ""}`}
                        onClick={() => navigate("/analytics")}
                    >
                        <span className="nav-item-icon">📊</span>
                        Analytics Dashboard
                    </button>
                    <button
                        className={`nav-item ${location.pathname === "/enrollment" ? "active" : ""}`}
                        onClick={() => navigate("/enrollment")}
                    >
                        <span className="nav-item-icon">📋</span>
                        Enrollment Tracker
                    </button>
                    <div className="sidebar-section-label">Features</div>
                    <button
                        className={`nav-item ${location.pathname === "/chat" ? "active" : ""}`}
                        onClick={() => navigate("/chat")}
                    >
                        <span className="nav-item-icon">🤖</span>
                        AI Assistant
                    </button>
                    <button
                        className={`nav-item ${location.pathname === "/security" ? "active" : ""}`}
                        onClick={() => navigate("/security")}
                    >
                        <span className="nav-item-icon">🔒</span>
                        Security & Privacy
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">D</div>
                        <div>
                            <div className="sidebar-user-name">Dr. Diya</div>
                            <div className="sidebar-user-role">Oncologist</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="main-content">
                {/* Topbar */}
                <div className="topbar">
                    <div className="topbar-title">{title}</div>
                    <div className="topbar-right">
                        <span className="topbar-badge">🟢 AI Active</span>
                        <span style={{ fontSize: "13px", color: "#64748B" }}>
                            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                    </div>
                </div>

                {/* Page Content */}
                <div className="page">
                    {children}
                </div>
            </div>
        </div>
    );
}