// src/pages/AIChatPage.jsx
// AI Chat Assistant for searching and comparing trials

import React, { useState, useRef, useEffect } from "react";
import Layout from "../components/Layout";

const SUGGESTIONS = [
    "What trials are available for HER2 positive breast cancer?",
    "Compare Phase 2 vs Phase 3 trials",
    "What biomarkers are needed for lung cancer trials?",
    "Show me low risk trials with high match scores",
    "What is EGFR mutation and which trials target it?",
    "Explain what Phase 1 clinical trial means",
];

export default function AIChatPage() {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "👋 Hello! I'm your AI oncology assistant. I can help you:\n\n• Search and explain clinical trials\n• Compare trial options\n• Explain biomarkers and eligibility criteria\n• Answer questions about cancer treatments\n\nWhat would you like to know?",
            time: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage(text) {
        const userText = text || input.trim();
        if (!userText) return;

        setInput("");

        setMessages(prev => [
            ...prev,
            {
                role: "user",
                content: userText,
                time: new Date(),
            },
        ]);

        setLoading(true);

        try {
            const response = await fetch("http://localhost:8001/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "user",
                            content: userText,
                        },
                    ],
                }),
            });
            const data = await response.json();

            console.log("Backend Response:", data);

            const reply =
                data.content ||
                "Sorry, I couldn't generate a response.";

            setMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: reply,
                    time: new Date(),
                },
            ]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: "⚠️ Sorry, something went wrong while contacting the backend.",
                    time: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    }

    function formatTime(date) {
        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatMessage(text) {
        return text.split("\n").map((line, i) => (
            <span key={i}>
                {line}
                {i < text.split("\n").length - 1 && <br />}
            </span>
        ));
    }

    return (
        <Layout title="AI Chat Assistant">

            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">🤖 AI Chat Assistant</h1>
                <p className="page-subtitle">
                    Ask anything about clinical trials, biomarkers, or cancer treatments
                </p>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 280px",
                gap: 20,
                height: "calc(100vh - 220px)",
            }}>

                {/* Chat Window */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "#FFFFFF",
                    borderRadius: 16,
                    border: "1px solid #E2E8F0",
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(99,102,241,0.08)",
                }}>
                    {/* Chat header */}
                    <div style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid #F1F5F9",
                        background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                    }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            background: "rgba(255,255,255,0.2)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                        }}>
                            🤖
                        </div>
                        <div>
                            <div style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#FFFFFF",
                            }}>
                                OncoAI Assistant
                            </div>
                            <div style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.7)",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                            }}>
                                <span style={{
                                    width: 6,
                                    height: 6,
                                    background: "#4ADE80",
                                    borderRadius: "50%",
                                    display: "inline-block",
                                }} />
                                Online · Powered by Gemini AI
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                    }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                display: "flex",
                                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                                gap: 10,
                            }}>
                                {msg.role === "assistant" && (
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 14,
                                        flexShrink: 0,
                                        marginTop: 2,
                                    }}>
                                        🤖
                                    </div>
                                )}
                                <div style={{ maxWidth: "75%" }}>
                                    <div style={{
                                        padding: "12px 16px",
                                        borderRadius: msg.role === "user"
                                            ? "18px 18px 4px 18px"
                                            : "4px 18px 18px 18px",
                                        background: msg.role === "user"
                                            ? "linear-gradient(135deg, #6366F1, #4F46E5)"
                                            : "#F8FAFF",
                                        color: msg.role === "user" ? "#FFFFFF" : "#1E293B",
                                        fontSize: 13.5,
                                        lineHeight: 1.6,
                                        border: msg.role === "assistant"
                                            ? "1px solid #E2E8F0"
                                            : "none",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    }}>
                                        {formatMessage(msg.content)}
                                    </div>
                                    <div style={{
                                        fontSize: 10,
                                        color: "#94A3B8",
                                        marginTop: 4,
                                        textAlign: msg.role === "user" ? "right" : "left",
                                    }}>
                                        {formatTime(msg.time)}
                                    </div>
                                </div>
                                {msg.role === "user" && (
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        background: "linear-gradient(135deg, #06B6D4, #0891B2)",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 14,
                                        flexShrink: 0,
                                        marginTop: 2,
                                    }}>
                                        👤
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {loading && (
                            <div style={{
                                display: "flex",
                                gap: 10,
                                alignItems: "center",
                            }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 14,
                                }}>
                                    🤖
                                </div>
                                <div style={{
                                    padding: "12px 16px",
                                    background: "#F8FAFF",
                                    borderRadius: "4px 18px 18px 18px",
                                    border: "1px solid #E2E8F0",
                                    display: "flex",
                                    gap: 6,
                                    alignItems: "center",
                                }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{
                                            width: 7,
                                            height: 7,
                                            background: "#6366F1",
                                            borderRadius: "50%",
                                            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input area */}
                    <div style={{
                        padding: "14px 16px",
                        borderTop: "1px solid #F1F5F9",
                        background: "#FAFBFF",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-end",
                    }}>
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="Ask about clinical trials, biomarkers, treatments…"
                            rows={2}
                            style={{
                                flex: 1,
                                padding: "10px 14px",
                                borderRadius: 12,
                                border: "1.5px solid #E2E8F0",
                                fontSize: 13.5,
                                fontFamily: "Inter, sans-serif",
                                resize: "none",
                                outline: "none",
                                background: "#FFFFFF",
                                color: "#1E293B",
                                lineHeight: 1.5,
                            }}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                            style={{
                                padding: "10px 18px",
                                borderRadius: 12,
                                border: "none",
                                background: loading || !input.trim()
                                    ? "#E2E8F0"
                                    : "linear-gradient(135deg, #6366F1, #4F46E5)",
                                color: loading || !input.trim() ? "#94A3B8" : "#FFFFFF",
                                fontSize: 20,
                                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                                height: 46,
                                flexShrink: 0,
                                transition: "all 0.2s",
                            }}
                        >
                            ➤
                        </button>
                    </div>
                </div>

                {/* Suggestions Panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Quick suggestions */}
                    <div style={{
                        background: "#FFFFFF",
                        borderRadius: 14,
                        border: "1px solid #E2E8F0",
                        overflow: "hidden",
                    }}>
                        <div style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #F1F5F9",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#374151",
                        }}>
                            💡 Quick Questions
                        </div>
                        <div style={{ padding: "10px 12px" }}>
                            {SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(s)}
                                    style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                        border: "none",
                                        background: "none",
                                        cursor: "pointer",
                                        fontSize: 12,
                                        color: "#374151",
                                        lineHeight: 1.4,
                                        marginBottom: 2,
                                        fontFamily: "Inter, sans-serif",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={e => e.target.style.background = "#F0F4FF"}
                                    onMouseLeave={e => e.target.style.background = "none"}
                                >
                                    → {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tips */}
                    <div style={{
                        background: "linear-gradient(135deg, #EEF2FF, #F5F3FF)",
                        borderRadius: 14,
                        border: "1px solid #C7D2FE",
                        padding: "14px 16px",
                    }}>
                        <div style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#6366F1",
                            marginBottom: 10,
                        }}>
                            🧠 AI Capabilities
                        </div>
                        {[
                            "Explain trial eligibility criteria",
                            "Compare multiple trials",
                            "Decode biomarker reports",
                            "Suggest matching trials",
                            "Explain medical terminology",
                            "Summarize treatment options",
                        ].map((tip, i) => (
                            <div key={i} style={{
                                display: "flex",
                                gap: 6,
                                marginBottom: 6,
                                fontSize: 11.5,
                                color: "#4338CA",
                            }}>
                                <span>✓</span>
                                <span>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bounce animation */}
            <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>

        </Layout>
    );
}