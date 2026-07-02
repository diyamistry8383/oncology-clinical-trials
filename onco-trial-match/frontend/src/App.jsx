import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PatientProfileBuilder from "./pages/PatientProfileBuilder";
import TrialMatchList from "./pages/TrialMatchList";
import OncologistReview from "./pages/OncologistReview";
import EnrollmentTracker from "./pages/EnrollmentTracker";
import AIChatPage from "./pages/AIChatPage";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import SecurityDashboard from "./pages/SecurityDashboard";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<PatientProfileBuilder />} />
                <Route path="/patients/:patientId/matches" element={<TrialMatchList />} />
                <Route path="/oncologist" element={<OncologistReview />} />
                <Route path="/enrollment" element={<EnrollmentTracker />} />
                <Route path="/chat" element={<AIChatPage />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/security" element={<SecurityDashboard />} />
            </Routes>
        </BrowserRouter>
    );
}