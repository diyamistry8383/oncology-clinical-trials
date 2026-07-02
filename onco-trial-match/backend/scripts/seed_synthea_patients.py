"""
Seeds the database with synthetic oncology patients (see
synthea_patient_data.py for the dataset and provenance notes).

CLI usage:
    python -m scripts.seed_synthea_patients
    python -m scripts.seed_synthea_patients --clear-existing

Run from the backend/ directory (or inside the backend container, where
this is already the working directory) so the `scripts` and `app`
packages both resolve correctly:
    docker exec -it onco_backend python -m scripts.seed_synthea_patients
"""
from __future__ import annotations

import argparse
import asyncio
import logging

from sqlalchemy import delete, select

from app.db import AsyncSessionLocal, init_db
from app.models.patient import Patient
from scripts.synthea_patient_data import SYNTHETIC_ONCOLOGY_PATIENTS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_synthea_patients")


async def clear_synthetic_patients(db) -> int:
    """
    Remove previously seeded synthetic patients (source="synthea") before
    re-seeding, so re-running this script doesn't pile up duplicates.
    Deliberately scoped to source="synthea" only — never touches
    manually-created patients (source="manual"), so test patients you
    created by hand through the API/frontend are left alone.
    """
    result = await db.execute(select(Patient).where(Patient.source == "synthea"))
    existing = result.scalars().all()
    count = len(existing)
    if count:
        await db.execute(delete(Patient).where(Patient.source == "synthea"))
        await db.commit()
    return count


async def seed_patients(clear_existing: bool = False) -> int:
    await init_db()

    async with AsyncSessionLocal() as db:
        if clear_existing:
            removed = await clear_synthetic_patients(db)
            if removed:
                logger.info("Removed %d previously seeded synthetic patients", removed)

        created = 0
        for patient_data in SYNTHETIC_ONCOLOGY_PATIENTS:
            patient = Patient(**patient_data, source="synthea")
            db.add(patient)
            created += 1
            logger.info("Seeding %s (%s)", patient_data["display_name"], patient_data["primary_diagnosis"])

        await db.commit()

    logger.info("Seeding complete: %d synthetic patients created", created)
    return created


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed synthetic oncology patients")
    parser.add_argument(
        "--clear-existing",
        action="store_true",
        help="Remove previously seeded synthetic patients (source=synthea) before re-seeding",
    )
    args = parser.parse_args()

    asyncio.run(seed_patients(clear_existing=args.clear_existing))


if __name__ == "__main__":
    main()