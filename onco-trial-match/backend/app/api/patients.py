"""
CRUD API for patient clinical profiles. This is the "patient profile
builder" surface the frontend (Step 7) will use to create/edit patients
before requesting trial matches.

Security: All text inputs are sanitized via bleach to prevent XSS.
All mutations are audit-logged for HIPAA-style compliance.
"""
import io
import uuid
import pandas as pd

from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientRead, PatientUpdate
from app.security import sanitize_patient_input, log_audit_event

router = APIRouter()


@router.post("", response_model=PatientRead, status_code=201)
async def create_patient(payload: PatientCreate, request: Request, db: AsyncSession = Depends(get_db)):
    sanitized = sanitize_patient_input(payload.model_dump())
    patient = Patient(**sanitized, source="manual")
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    log_audit_event(
        action="PATIENT_CREATED",
        resource_type="patient",
        resource_id=str(patient.id),
        user_ip=request.client.host if request.client else None,
        details=f"name={patient.display_name}",
    )
    return patient


@router.post("/import", status_code=201)
async def import_patients(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    contents = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Only .csv and .xlsx files are supported")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Replace NaNs with None
    df = df.where(pd.notnull(df), None)

    imported_count = 0
    errors = []

    for index, row in df.iterrows():
        try:
            def parse_list(val):
                if not val: return []
                if isinstance(val, str):
                    return [s.strip() for s in val.split(",") if s.strip()]
                if isinstance(val, list):
                    return val
                return []

            # Safe extraction
            patient_data = {
                "display_name": str(row.get("display_name") or row.get("Patient Name") or f"Imported Patient {index+1}"),
                "age": int(row.get("age") or row.get("Age") or 0),
                "sex": str(row.get("sex") or row.get("Sex") or "ALL").upper(),
                "primary_diagnosis": str(row.get("primary_diagnosis") or row.get("Primary Diagnosis") or "Unknown Diagnosis"),
                "cancer_type": str(row.get("cancer_type") or row.get("Cancer Type") or "Unknown Cancer"),
                "stage": str(row.get("stage") or row.get("Stage")) if row.get("stage") is not None or row.get("Stage") is not None else None,
                "ecog_status": int(row.get("ecog_status") or row.get("ECOG")) if row.get("ecog_status") is not None or row.get("ECOG") is not None else None,
                "biomarkers": parse_list(row.get("biomarkers") or row.get("Biomarkers")),
                "prior_treatments": parse_list(row.get("prior_treatments") or row.get("Prior Treatments")),
                "comorbidities": parse_list(row.get("comorbidities") or row.get("Comorbidities")),
                "clinical_summary": str(row.get("clinical_summary") or row.get("Clinical Summary")) if row.get("clinical_summary") or row.get("Clinical Summary") else None,
            }
            
            # Clean up string "nan" or "none"
            for k, v in patient_data.items():
                if isinstance(v, str) and v.lower() in ("nan", "none", ""):
                    patient_data[k] = None

            validated = PatientCreate(**patient_data)
            sanitized = sanitize_patient_input(validated.model_dump())
            
            patient = Patient(**sanitized, source="import")
            db.add(patient)
            imported_count += 1
        except Exception as e:
            errors.append(f"Row {index + 1}: {str(e)}")

    if imported_count == 0 and errors:
        raise HTTPException(status_code=400, detail={"message": "Failed to import any patients.", "errors": errors})

    await db.commit()
    
    log_audit_event(
        action="PATIENT_IMPORTED_BATCH",
        resource_type="patient",
        resource_id="batch",
        user_ip=request.client.host if request.client else None,
        details=f"imported_count={imported_count}, filename={filename}",
    )
    
    return {"message": f"Successfully imported {imported_count} patients.", "imported_count": imported_count, "errors": errors}


@router.get("", response_model=list[PatientRead])
async def list_patients(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
):
    query = select(Patient).order_by(Patient.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{patient_id}", response_model=PatientRead)
async def get_patient(patient_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=PatientRead)
async def update_patient(patient_id: uuid.UUID, payload: PatientUpdate, request: Request, db: AsyncSession = Depends(get_db)):
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    updates = sanitize_patient_input(payload.model_dump(exclude_unset=True))
    for key, value in updates.items():
        setattr(patient, key, value)

    await db.commit()
    await db.refresh(patient)
    log_audit_event(
        action="PATIENT_UPDATED",
        resource_type="patient",
        resource_id=str(patient.id),
        user_ip=request.client.host if request.client else None,
        details=f"fields={list(updates.keys())}",
    )
    return patient


@router.delete("/{patient_id}", status_code=204)
async def delete_patient(patient_id: uuid.UUID, request: Request, db: AsyncSession = Depends(get_db)):
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    log_audit_event(
        action="PATIENT_DELETED",
        resource_type="patient",
        resource_id=str(patient_id),
        user_ip=request.client.host if request.client else None,
    )
    await db.delete(patient)
    await db.commit()
