import axios from "axios";

// In dev, Vite's proxy (vite.config.js) forwards /api/* to the backend
// container, so we never hardcode a host/port here — this also makes the
// build portable across docker-compose, local dev, and any future deploy
// target without code changes.
const client = axios.create({
    baseURL: "/api",
    headers: { "Content-Type": "application/json" },
});

// --- Trials ---
export const listTrials = (params = {}) => client.get("/trials", { params }).then((r) => r.data);
export const getTrial = (trialId) => client.get(`/trials/${trialId}`).then((r) => r.data);
export const getTrialSummary = (trialId) => client.get(`/trials/${trialId}/ai-summary`).then((r) => r.data);
export const compareTrials = (trialIds) => client.post("/trials/compare", { trial_ids: trialIds }).then((r) => r.data);

// --- Patients ---
export const listPatients = (params = {}) => client.get("/patients", { params }).then((r) => r.data);
export const getPatient = (patientId) => client.get(`/patients/${patientId}`).then((r) => r.data);
export const createPatient = (payload) => client.post("/patients", payload).then((r) => r.data);
export const updatePatient = (patientId, payload) =>
    client.patch(`/patients/${patientId}`, payload).then((r) => r.data);
export const deletePatient = (patientId) => client.delete(`/patients/${patientId}`);
export const importPatients = (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return client.post("/patients/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
};

// --- Matches ---
export const matchPatientToTrials = (patientId, payload = { top_k: 5, include_llm_summary: true }) =>
    client.post(`/patients/${patientId}/match`, payload).then((r) => r.data);
export const listPatientMatches = (patientId) =>
    client.get(`/patients/${patientId}/matches`).then((r) => r.data);
export const getMatch = (matchId) => client.get(`/matches/${matchId}`).then((r) => r.data);
export const recordMatchDecision = (matchId, payload) =>
    client.post(`/matches/${matchId}/decision`, payload).then((r) => r.data);

// --- Review ---
export const getReviewQueue = (params = {}) => client.get("/review/queue", { params }).then((r) => r.data);
export const getEnrollmentTracker = () => client.get("/review/enrollment-tracker").then((r) => r.data);
export const sendChatMessage = (messages, patientId = null) =>
    client.post("/chat", { messages, patient_id: patientId }).then((r) => r.data);

export default client;