"""
Synthetic oncology patient profiles for seeding the database with varied,
realistic test data — modeled on the kind of patient Synthea's cancer
modules (lung, breast, colorectal cancer modules in synthetichealth/synthea)
would generate, but authored directly here rather than requiring a
multi-GB Synthea FHIR bundle download.

Each entry mirrors the clinically-relevant fields a real Synthea Patient
bundle would carry across its Patient/Condition/Observation/MedicationRequest
resources: demographics, primary diagnosis + stage, biomarker observations,
prior treatment (MedicationRequest history), and comorbidities (Condition
list). Names are generic placeholders, not derived from any real person.

This data is synthetic and free of any real patient information, consistent
with Synthea's own data usage terms (CC0 / no privacy restrictions).
"""

SYNTHETIC_ONCOLOGY_PATIENTS = [
    {
        "display_name": "Synthea Patient 001",
        "age": 64,
        "sex": "FEMALE",
        "primary_diagnosis": "Stage III Non-Small Cell Lung Cancer",
        "cancer_type": "Lung Cancer",
        "stage": "III",
        "ecog_status": 1,
        "biomarkers": ["EGFR mutation positive"],
        "prior_treatments": ["Carboplatin", "Pemetrexed"],
        "comorbidities": ["Hypertension", "Type 2 diabetes"],
        "clinical_summary": "Diagnosed 8 months ago following persistent cough. "
        "Completed 4 cycles of platinum-based chemotherapy with partial response.",
    },
    {
        "display_name": "Synthea Patient 002",
        "age": 71,
        "sex": "MALE",
        "primary_diagnosis": "Metastatic Castration-Resistant Prostate Cancer",
        "cancer_type": "Prostate Cancer",
        "stage": "IV",
        "ecog_status": 2,
        "biomarkers": ["BRCA2 mutation positive"],
        "prior_treatments": ["Androgen deprivation therapy", "Docetaxel"],
        "comorbidities": ["Coronary artery disease"],
        "clinical_summary": "Progressed on androgen deprivation therapy; PSA rising "
        "despite castrate testosterone levels. Now being evaluated for PARP inhibitor trials.",
    },
    {
        "display_name": "Synthea Patient 003",
        "age": 52,
        "sex": "FEMALE",
        "primary_diagnosis": "HER2-Positive Invasive Ductal Carcinoma",
        "cancer_type": "Breast Cancer",
        "stage": "II",
        "ecog_status": 0,
        "biomarkers": ["HER2 positive", "ER negative", "PR negative"],
        "prior_treatments": ["Doxorubicin", "Cyclophosphamide"],
        "comorbidities": [],
        "clinical_summary": "Post-lumpectomy, completed adjuvant chemotherapy. "
        "Currently on maintenance trastuzumab with no evidence of recurrence on last imaging.",
    },
    {
        "display_name": "Synthea Patient 004",
        "age": 59,
        "sex": "MALE",
        "primary_diagnosis": "Metastatic Colorectal Cancer",
        "cancer_type": "Colorectal Cancer",
        "stage": "IV",
        "ecog_status": 1,
        "biomarkers": ["KRAS G12C mutation", "MSI-stable"],
        "prior_treatments": ["FOLFOX", "Bevacizumab"],
        "comorbidities": ["Chronic kidney disease, stage 2"],
        "clinical_summary": "Liver metastases identified at diagnosis. Disease progressed "
        "after first-line FOLFOX plus bevacizumab; evaluating second-line options including "
        "KRAS G12C-targeted therapy trials.",
    },
    {
        "display_name": "Synthea Patient 005",
        "age": 45,
        "sex": "FEMALE",
        "primary_diagnosis": "Relapsed Diffuse Large B-Cell Lymphoma",
        "cancer_type": "Lymphoma",
        "stage": "III",
        "ecog_status": 1,
        "biomarkers": ["CD19 positive"],
        "prior_treatments": ["R-CHOP", "Autologous stem cell transplant"],
        "comorbidities": [],
        "clinical_summary": "Relapsed 14 months post-transplant. Being evaluated for "
        "CAR-T cell therapy trials given CD19-positive disease.",
    },
    {
        "display_name": "Synthea Patient 006",
        "age": 68,
        "sex": "MALE",
        "primary_diagnosis": "Acute Myeloid Leukemia",
        "cancer_type": "Leukemia",
        "stage": None,
        "ecog_status": 2,
        "biomarkers": ["FLT3-ITD positive"],
        "prior_treatments": ["Induction chemotherapy (7+3 regimen)"],
        "comorbidities": ["Atrial fibrillation"],
        "clinical_summary": "Relapsed after initial induction therapy. FLT3-ITD positive "
        "disease — candidate for FLT3 inhibitor combination trials.",
    },
    {
        "display_name": "Synthea Patient 007",
        "age": 37,
        "sex": "FEMALE",
        "primary_diagnosis": "BRCA1-Mutant Triple-Negative Breast Cancer",
        "cancer_type": "Breast Cancer",
        "stage": "II",
        "ecog_status": 0,
        "biomarkers": ["BRCA1 mutation positive", "ER negative", "PR negative", "HER2 negative"],
        "prior_treatments": [],
        "comorbidities": [],
        "clinical_summary": "Newly diagnosed, treatment-naive. Genetic testing confirmed "
        "germline BRCA1 mutation. Being evaluated for neoadjuvant trial enrollment before surgery.",
    },
    {
        "display_name": "Synthea Patient 008",
        "age": 76,
        "sex": "MALE",
        "primary_diagnosis": "Stage IV Pancreatic Adenocarcinoma",
        "cancer_type": "Pancreatic Cancer",
        "stage": "IV",
        "ecog_status": 1,
        "biomarkers": ["KRAS mutation positive"],
        "prior_treatments": ["FOLFIRINOX"],
        "comorbidities": ["Type 2 diabetes", "Chronic pancreatitis"],
        "clinical_summary": "Metastatic at diagnosis with liver and peritoneal involvement. "
        "Modest response to first-line FOLFIRINOX; tolerability has been a limiting factor.",
    },
    {
        "display_name": "Synthea Patient 009",
        "age": 29,
        "sex": "FEMALE",
        "primary_diagnosis": "Hodgkin Lymphoma",
        "cancer_type": "Lymphoma",
        "stage": "II",
        "ecog_status": 0,
        "biomarkers": ["PD-L1 positive"],
        "prior_treatments": ["ABVD chemotherapy"],
        "comorbidities": [],
        "clinical_summary": "Completed first-line ABVD with residual PET-positive disease. "
        "Considering checkpoint inhibitor trials given PD-L1 positivity.",
    },
    {
        "display_name": "Synthea Patient 010",
        "age": 61,
        "sex": "MALE",
        "primary_diagnosis": "Squamous Cell Carcinoma of the Head and Neck, HPV-Negative",
        "cancer_type": "Head and Neck Cancer",
        "stage": "III",
        "ecog_status": 1,
        "biomarkers": [],
        "prior_treatments": ["Cisplatin", "Radiation therapy"],
        "comorbidities": ["COPD", "Long-term tobacco use"],
        "clinical_summary": "Completed concurrent chemoradiation. Surveillance imaging "
        "shows localized recurrence; being assessed for salvage surgery vs. clinical trial options.",
    },
]