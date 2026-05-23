"""
Patient Workspace — persistent evidence memory layer.

Provides read/write access to PatientInsight rows: the longitudinal record
of every clinical question synthesised for a patient across all sessions.

Design notes:
- evidence_levels is computed from the summaries list at write time, not stored
  redundantly in the report — this keeps the source of truth in the job.
- source_pmids is extracted from summaries[*].pmid so the workspace can show
  "based on N papers" without loading the full summaries blob.
- All functions are async to match the FastAPI / SQLAlchemy async pattern.
  Callers from Celery tasks must wrap in asyncio.run().
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import Patient, PatientInsight


# ─── Write ────────────────────────────────────────────────────────────────────

async def save_insight(
    db: AsyncSession,
    *,
    fhir_patient_id: str,
    job_id: str,
    question: str,
    report: dict,
    summaries: list,
    contradictions: list,
) -> Optional[PatientInsight]:
    """
    Persist a completed synthesis as a PatientInsight row.

    Returns the saved row, or None if the patient is not found in the local
    cache (e.g. they were never synced from FHIR).
    """
    # Look up the local Patient row — we need its UUID primary key
    result = await db.execute(
        select(Patient).where(Patient.fhir_id == fhir_patient_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        return None

    # Derive evidence level tally from summaries
    evidence_levels: dict[str, int] = {}
    source_pmids: list[str] = []
    for s in (summaries or []):
        level = s.get("evidence_level", "4")
        evidence_levels[level] = evidence_levels.get(level, 0) + 1
        pmid = s.get("pmid") or s.get("trial_id")
        if pmid:
            source_pmids.append(str(pmid))

    insight = PatientInsight(
        id                   = uuid.uuid4(),
        patient_id           = patient.id,
        job_id               = uuid.UUID(job_id) if job_id else None,
        question             = question,
        clinical_bottom_line = report.get("clinical_bottom_line"),
        recommendations      = report.get("recommendations") or [],
        evidence_levels      = evidence_levels,
        source_pmids         = source_pmids,
        drug_interactions    = report.get("drug_interactions") or [],
        contradictions       = contradictions or [],
        created_at           = datetime.utcnow(),
    )

    db.add(insight)
    await db.commit()
    await db.refresh(insight)
    return insight


# ─── Read ─────────────────────────────────────────────────────────────────────

async def get_patient_insights(
    db: AsyncSession,
    fhir_patient_id: str,
    limit: int = 50,
) -> list[dict]:
    """
    Return all insights for a patient, newest first, as serialisable dicts.
    Used by the workspace timeline endpoint.
    """
    result = await db.execute(
        select(Patient).where(Patient.fhir_id == fhir_patient_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        return []

    rows = await db.execute(
        select(PatientInsight)
        .where(PatientInsight.patient_id == patient.id)
        .order_by(desc(PatientInsight.created_at))
        .limit(limit)
    )
    insights = rows.scalars().all()
    return [_serialize(i) for i in insights]


async def get_insight_by_id(
    db: AsyncSession,
    insight_id: str,
) -> Optional[dict]:
    """Return a single insight by its UUID, or None if not found."""
    result = await db.execute(
        select(PatientInsight).where(PatientInsight.id == uuid.UUID(insight_id))
    )
    row = result.scalar_one_or_none()
    return _serialize(row) if row else None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _serialize(insight: PatientInsight) -> dict:
    return {
        "id":                   str(insight.id),
        "patient_id":           str(insight.patient_id),
        "job_id":               str(insight.job_id) if insight.job_id else None,
        "question":             insight.question,
        "clinical_bottom_line": insight.clinical_bottom_line,
        "recommendations":      insight.recommendations or [],
        "evidence_levels":      insight.evidence_levels or {},
        "source_pmids":         insight.source_pmids or [],
        "drug_interactions":    insight.drug_interactions or [],
        "contradictions":       insight.contradictions or [],
        "created_at":           insight.created_at.isoformat() if insight.created_at else None,
        # Derived convenience fields for the frontend timeline
        "source_count":         len(insight.source_pmids or []),
        "rec_count":            len(insight.recommendations or []),
        "top_evidence":         _top_level(insight.evidence_levels or {}),
    }


def _top_level(levels: dict) -> str:
    """Return the highest evidence level present in this insight."""
    for lvl in ("1A", "1B", "2A", "2B", "3", "4"):
        if levels.get(lvl, 0) > 0:
            return lvl
    return "4"
