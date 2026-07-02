// src/data/cancerTypes.js
// All cancer types with colors, icons, biomarkers

export const CANCER_TYPES = [
    {
        id: "breast",
        label: "Breast Cancer",
        icon: "🎀",
        color: "#E91E8C",
        bgColor: "#FDE8F3",
        keywords: ["breast", "mammary", "HER2", "BRCA", "TNBC"],
        commonBiomarkers: ["HER2", "ER", "PR", "BRCA1", "BRCA2", "Ki-67"],
    },
    {
        id: "lung",
        label: "Lung Cancer",
        icon: "🫁",
        color: "#1565C0",
        bgColor: "#E3F2FD",
        keywords: ["lung", "NSCLC", "SCLC", "pulmonary", "bronchial"],
        commonBiomarkers: ["EGFR", "ALK", "ROS1", "PD-L1", "KRAS", "BRAF"],
    },
    {
        id: "colon",
        label: "Colorectal Cancer",
        icon: "🔵",
        color: "#2E7D32",
        bgColor: "#E8F5E9",
        keywords: ["colon", "colorectal", "rectal", "bowel", "sigmoid"],
        commonBiomarkers: ["KRAS", "NRAS", "BRAF", "MSI", "CEA"],
    },
    {
        id: "prostate",
        label: "Prostate Cancer",
        icon: "🔷",
        color: "#3949AB",
        bgColor: "#E8EAF6",
        keywords: ["prostate", "PSA", "androgen", "castration", "CRPC"],
        commonBiomarkers: ["PSA", "AR", "BRCA2", "ATM", "CDK12"],
    },
    {
        id: "leukemia",
        label: "Leukemia",
        icon: "🩸",
        color: "#B71C1C",
        bgColor: "#FFEBEE",
        keywords: ["leukemia", "AML", "ALL", "CML", "CLL", "myeloid"],
        commonBiomarkers: ["BCR-ABL", "FLT3", "NPM1", "IDH1", "IDH2"],
    },
    {
        id: "lymphoma",
        label: "Lymphoma",
        icon: "🟣",
        color: "#6A1B9A",
        bgColor: "#F3E5F5",
        keywords: ["lymphoma", "hodgkin", "NHL", "diffuse large B", "follicular"],
        commonBiomarkers: ["CD20", "CD30", "BCL2", "BCL6", "MYC"],
    },
    {
        id: "melanoma",
        label: "Melanoma",
        icon: "🟤",
        color: "#4E342E",
        bgColor: "#EFEBE9",
        keywords: ["melanoma", "skin", "cutaneous", "uveal"],
        commonBiomarkers: ["BRAF", "NRAS", "KIT", "PD-L1", "TMB"],
    },
    {
        id: "pancreatic",
        label: "Pancreatic Cancer",
        icon: "🟡",
        color: "#F57F17",
        bgColor: "#FFF8E1",
        keywords: ["pancreatic", "pancreas", "PDAC", "ductal adenocarcinoma"],
        commonBiomarkers: ["KRAS", "BRCA2", "ATM", "CA19-9"],
    },
    {
        id: "ovarian",
        label: "Ovarian Cancer",
        icon: "🔴",
        color: "#C62828",
        bgColor: "#FFF3E0",
        keywords: ["ovarian", "ovary", "fallopian", "peritoneal", "HGSOC"],
        commonBiomarkers: ["BRCA1", "BRCA2", "HRD", "CA-125"],
    },
    {
        id: "brain",
        label: "Brain Tumors",
        icon: "🧠",
        color: "#37474F",
        bgColor: "#ECEFF1",
        keywords: ["brain", "glioblastoma", "GBM", "glioma", "astrocytoma"],
        commonBiomarkers: ["IDH1", "IDH2", "MGMT", "EGFR", "TERT"],
    },
];

export const TRIAL_STATUSES = [
    { value: "RECRUITING", label: "Recruiting", color: "#2E7D32", bg: "#E8F5E9" },
    { value: "NOT_YET_RECRUITING", label: "Not Yet Recruiting", color: "#1565C0", bg: "#E3F2FD" },
    { value: "ACTIVE_NOT_RECRUITING", label: "Active", color: "#F57F17", bg: "#FFF8E1" },
    { value: "COMPLETED", label: "Completed", color: "#546E7A", bg: "#ECEFF1" },
];

export const TRIAL_PHASES = ["PHASE1", "PHASE2", "PHASE3", "PHASE4"];