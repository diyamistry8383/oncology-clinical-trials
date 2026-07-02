import Layout from "../components/Layout";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPatient, listPatients, deletePatient, importPatients } from "../api/client.js";

const EMPTY_FORM = {
    display_name: "",
    age: "",
    sex: "FEMALE",
    primary_diagnosis: "",
    cancer_type: "",
    stage: "",
    ecog_status: "",
    biomarkers: "",
    prior_treatments: "",
    clinical_summary: "",
};

export default function PatientProfileBuilder() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadPatients();
    }, []);

    async function loadPatients() {
        setLoading(true);
        try {
            const data = await listPatients({ limit: 50 });
            setPatients(data);
            setError(null);
        } catch (err) {
            setError("Couldn't load patients. Check that the backend is running.");
        } finally {
            setLoading(false);
        }
    }

    function updateField(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function parseListField(value) {
        return value.split(",").map((s) => s.trim()).filter(Boolean);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                display_name: form.display_name,
                age: Number(form.age),
                sex: form.sex,
                primary_diagnosis: form.primary_diagnosis,
                cancer_type: form.cancer_type,
                stage: form.stage || null,
                ecog_status: form.ecog_status === "" ? null : Number(form.ecog_status),
                biomarkers: parseListField(form.biomarkers),
                prior_treatments: parseListField(form.prior_treatments),
                clinical_summary: form.clinical_summary || null,
            };
            await createPatient(payload);
            setForm(EMPTY_FORM);
            await loadPatients();
        } catch (err) {
            const detail = err?.response?.data?.detail;
            setError(typeof detail === "string" ? detail : "Couldn't create patient.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleFileImport(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setError(null);
        try {
            const result = await importPatients(file);
            alert(`✅ ${result.message}`);
            await loadPatients();
        } catch (err) {
            const detail = err?.response?.data?.detail;
            if (typeof detail === 'object' && detail?.message) {
                setError(`${detail.message} Check console for row errors.`);
                console.error("Import errors:", detail.errors);
            } else {
                setError(typeof detail === "string" ? detail : "Couldn't import patients. Please check the file format.");
            }
        } finally {
            setImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }

    async function handleDelete(patientId) {
        if (!window.confirm("Delete this patient? This cannot be undone.")) return;
        try {
            await deletePatient(patientId);
            await loadPatients();
        } catch {
            setError("Couldn't delete patient.");
        }
    }

    return (
        <Layout title="Patient Profiles">

            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">👥 Patient Profile Builder</h1>
                <p className="page-subtitle">
                    Add a patient's clinical profile, then match them against open trials.
                </p>
            </div>

            {/* Stats Row */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple">👥</div>
                    <div>
                        <div className="stat-value">{patients.length}</div>
                        <div className="stat-label">Total Patients</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon cyan">🧬</div>
                    <div>
                        <div className="stat-value">
                            {patients.filter(p => p.biomarkers?.length > 0).length}
                        </div>
                        <div className="stat-label">With Biomarkers</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">♀</div>
                    <div>
                        <div className="stat-value">
                            {patients.filter(p => p.sex === "FEMALE").length}
                        </div>
                        <div className="stat-label">Female</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon amber">♂</div>
                    <div>
                        <div className="stat-value">
                            {patients.filter(p => p.sex === "MALE").length}
                        </div>
                        <div className="stat-label">Male</div>
                    </div>
                </div>
            </div>

            {error && <div className="error-banner">⚠️ {error}</div>}

            {/* Add Patient Form */}
            <div className="card" style={{ marginBottom: 28 }}>
                <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div className="card-title">➕ Add New Patient</div>
                    <div>
                        <input 
                            type="file" 
                            accept=".csv, .xlsx" 
                            style={{ display: "none" }} 
                            ref={fileInputRef}
                            onChange={handleFileImport}
                        />
                        <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                        >
                            {importing ? "⏳ Importing..." : "📥 Import Legacy Data (Excel/CSV)"}
                        </button>
                    </div>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="form-grid">
                        <div className="form-field">
                            <label className="form-label" htmlFor="display_name">
                                Patient Name
                            </label>
                            <input
                                id="display_name"
                                className="form-input"
                                required
                                value={form.display_name}
                                onChange={(e) => updateField("display_name", e.target.value)}
                                placeholder="e.g. Jane Doe"
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label" htmlFor="age">Age</label>
                            <input
                                id="age"
                                type="number"
                                min="0"
                                max="120"
                                className="form-input"
                                required
                                value={form.age}
                                onChange={(e) => updateField("age", e.target.value)}
                                placeholder="e.g. 52"
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label" htmlFor="sex">Sex</label>
                            <select
                                id="sex"
                                className="form-select"
                                value={form.sex}
                                onChange={(e) => updateField("sex", e.target.value)}
                            >
                                <option value="FEMALE">Female</option>
                                <option value="MALE">Male</option>
                                <option value="ALL">Other / Unspecified</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label className="form-label" htmlFor="cancer_type">
                                Cancer Type
                            </label>
                            <input
                                id="cancer_type"
                                className="form-input"
                                required
                                value={form.cancer_type}
                                onChange={(e) => updateField("cancer_type", e.target.value)}
                                placeholder="e.g. Lung Cancer"
                            />
                        </div>

                        <div className="form-field form-field--full">
                            <label className="form-label" htmlFor="primary_diagnosis">
                                Primary Diagnosis
                            </label>
                            <input
                                id="primary_diagnosis"
                                className="form-input"
                                required
                                value={form.primary_diagnosis}
                                onChange={(e) => updateField("primary_diagnosis", e.target.value)}
                                placeholder="e.g. Stage III Non-Small Cell Lung Cancer"
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label" htmlFor="stage">Stage</label>
                            <input
                                id="stage"
                                className="form-input"
                                value={form.stage}
                                onChange={(e) => updateField("stage", e.target.value)}
                                placeholder="e.g. III"
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label" htmlFor="ecog_status">
                                ECOG Status (0–5)
                            </label>
                            <input
                                id="ecog_status"
                                type="number"
                                min="0"
                                max="5"
                                className="form-input"
                                value={form.ecog_status}
                                onChange={(e) => updateField("ecog_status", e.target.value)}
                                placeholder="0"
                            />
                        </div>

                        <div className="form-field form-field--full">
                            <label className="form-label" htmlFor="biomarkers">
                                Biomarkers
                            </label>
                            <input
                                id="biomarkers"
                                className="form-input"
                                value={form.biomarkers}
                                onChange={(e) => updateField("biomarkers", e.target.value)}
                                placeholder="e.g. EGFR mutation positive, PD-L1 50%"
                            />
                            <span className="form-hint">
                                Separate multiple biomarkers with commas.
                            </span>
                        </div>

                        <div className="form-field form-field--full">
                            <label className="form-label" htmlFor="prior_treatments">
                                Prior Treatments
                            </label>
                            <input
                                id="prior_treatments"
                                className="form-input"
                                value={form.prior_treatments}
                                onChange={(e) => updateField("prior_treatments", e.target.value)}
                                placeholder="e.g. Carboplatin, Pemetrexed"
                            />
                        </div>

                        <div className="form-field form-field--full">
                            <label className="form-label" htmlFor="clinical_summary">
                                Clinical Summary (optional)
                            </label>
                            <textarea
                                id="clinical_summary"
                                className="form-textarea"
                                value={form.clinical_summary}
                                onChange={(e) => updateField("clinical_summary", e.target.value)}
                                placeholder="Free-text notes that add context beyond the structured fields above."
                            />
                        </div>

                        <div className="form-field form-field--full">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting}
                                style={{ width: "fit-content" }}
                            >
                                {submitting ? "⏳ Adding patient…" : "➕ Add Patient"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Patients Table */}
            <div className="card-title" style={{ marginBottom: 16, fontSize: 18 }}>
                🏥 Patients ({patients.length})
            </div>

            {loading ? (
                <div className="card">
                    <p className="loading-text">⏳ Loading patients…</p>
                </div>
            ) : patients.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">👤</div>
                    <p className="empty-state-title">No patients yet</p>
                    <p className="empty-state-body">
                        Add a patient above to start matching them against open trials.
                    </p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Patient Name</th>
                                <th>Primary Diagnosis</th>
                                <th>Cancer Type</th>
                                <th>Age / Sex</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((p) => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 600 }}>{p.display_name}</td>
                                    <td>{p.primary_diagnosis}</td>
                                    <td>
                                        <span className="badge badge-purple">
                                            {p.cancer_type || "—"}
                                        </span>
                                    </td>
                                    <td>{p.age} / {p.sex}</td>
                                    <td>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            style={{ marginRight: 8 }}
                                            onClick={() => navigate(`/patients/${p.id}/matches`)}
                                        >
                                            🎯 View matches
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(p.id)}
                                        >
                                            🗑 Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </Layout>
    );
}