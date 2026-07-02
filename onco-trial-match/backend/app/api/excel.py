from fastapi import FastAPI, UploadFile, File
import pandas as pd

@app.post("/api/excel/upload/patients")
async def upload_patients(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_excel(contents)
    # Process and save to database
    return {"rows": len(df), "message": "Uploaded successfully"}