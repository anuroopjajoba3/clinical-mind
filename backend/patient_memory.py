"""
Patient Memory Service
Syncs FHIR resources (Condition, MedicationRequest, Observation, AllergyIntolerance)
into the local patient_entities table for fast, structured access.
This is the persistence layer behind the Patient Memory Graph.
"""

import re
import uuid
from datetime import datetime
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

import fhir_client as fhir
from database import Patient, PatientEntity


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _coding_display(coding_list: list) -> str:
    for c in coding_list:
        if c.get("display"):
            return c["display"]
    return ""


def _coding_code(coding_list: list) -> str:
    for c in coding_list:
        if c.get("code"):
            return c["code"]
    return ""


def _patient_name(resource: dict) -> str:
    names = resource.get("name", [])
    if not names:
        return "Unknown"
    n = names[0]
    given = " ".join(n.get("given", []))
    family = n.get("family", "")
    return f"{given} {family}".strip()


def _patient_mrn(resource: dict) -> str:
    for ident in resource.get("identifier", []):
        if ident.get("use") == "official" or "mrn" in ident.get("system", "").lower():
            return ident.get("value", "")
    return ""


# ─── FHIR → PatientEntity converters ─────────────────────────────────────────

def _condition_to_entity(patient_db_id: uuid.UUID, res: dict) -> PatientEntity:
    coding = res.get("code", {}).get("coding", [])
    status = res.get("clinicalStatus", {}).get("coding", [{}])[0].get("code", "unknown")
    onset = res.get("onsetDateTime", res.get("onsetPeriod", {}).get("start", ""))
    return PatientEntity(
        patient_id=patient_db_id,
        fhir_id=res.get("id"),
        entity_type="condition",
        code=_coding_code(coding),
        display=_coding_display(coding) or res.get("code", {}).get("text", "Unknown condition"),
        status=status,
        onset_date=onset[:10] if onset else None,
        extra={"verificationStatus": res.get("verificationStatus", {})},
    )


def _medication_to_entity(patient_db_id: uuid.UUID, res: dict) -> PatientEntity:
    med = res.get("medicationCodeableConcept", {})
    coding = med.get("coding", [])
    status = res.get("status", "unknown")
    authored = res.get("authoredOn", "")
    return PatientEntity(
        patient_id=patient_db_id,
        fhir_id=res.get("id"),
        entity_type="medication",
        code=_coding_code(coding),
        display=_coding_display(coding) or med.get("text", "Unknown medication"),
        status=status,
        onset_date=authored[:10] if authored else None,
        extra={"dosage": res.get("dosageInstruction", [])},
    )


def _observation_to_entity(patient_db_id: uuid.UUID, res: dict) -> PatientEntity:
    coding = res.get("code", {}).get("coding", [])
    display = _coding_display(coding) or res.get("code", {}).get("text", "Unknown observation")

    value = ""
    if "valueQuantity" in res:
        vq = res["valueQuantity"]
        value = f"{vq.get('value', '')} {vq.get('unit', '')}".strip()
    elif "valueString" in res:
        value = res["valueString"]
    elif "valueCodeableConcept" in res:
        value = res["valueCodeableConcept"].get("text", "")

    effective = res.get("effectiveDateTime", res.get("effectivePeriod", {}).get("start", ""))
    return PatientEntity(
        patient_id=patient_db_id,
        fhir_id=res.get("id"),
        entity_type="lab",
        code=_coding_code(coding),
        display=display,
        status=res.get("status", "unknown"),
        onset_date=effective[:10] if effective else None,
        value=value,
        extra={"interpretation": res.get("interpretation", []),
               "referenceRange": res.get("referenceRange", [])},
    )


def _allergy_to_entity(patient_db_id: uuid.UUID, res: dict) -> PatientEntity:
    coding = res.get("code", {}).get("coding", [])
    status = res.get("clinicalStatus", {}).get("coding", [{}])[0].get("code", "active")
    onset = res.get("onsetDateTime", "")
    reactions = [r.get("description", "") for r in res.get("reaction", [])]
    return PatientEntity(
        patient_id=patient_db_id,
        fhir_id=res.get("id"),
        entity_type="allergy",
        code=_coding_code(coding),
        display=_coding_display(coding) or res.get("code", {}).get("text", "Unknown allergen"),
        status=status,
        onset_date=onset[:10] if onset else None,
        extra={"reactions": reactions, "criticality": res.get("criticality", "")},
    )


def _encounter_to_entity(patient_db_id: uuid.UUID, res: dict) -> PatientEntity:
    reason = ""
    for rc in res.get("reasonCode", []):
        reason = rc.get("text", "") or _coding_display(rc.get("coding", []))
        if reason:
            break
    period = res.get("period", {})
    start = period.get("start", "")
    return PatientEntity(
        patient_id=patient_db_id,
        fhir_id=res.get("id"),
        entity_type="encounter",
        code=res.get("class", {}).get("code", ""),
        display=reason or "Clinical encounter",
        status=res.get("status", "unknown"),
        onset_date=start[:10] if start else None,
        extra={"end": period.get("end", ""), "type": res.get("type", [])},
    )


# ─── Risk intelligence engine ────────────────────────────────────────────────

def _parse_numeric(val: str) -> float | None:
    if not val:
        return None
    m = re.match(r"^-?(\d+\.?\d*)", str(val))
    return float(m.group(1)) if m else None


def _compute_risk(ents: list) -> dict:
    """
    Analyzes a patient's entity list and returns a proactive risk assessment.
    Checks lab trajectories, clinical thresholds, and condition-medication gaps.
    Returns: { level: 'critical'|'watch'|'stable', flags: [str], flag_count: int }
    """
    flags = []
    level = "stable"

    # Build a lab map: normalised display name → list of {date, numeric}, sorted by date asc
    lab_map: dict[str, list] = {}
    for e in ents:
        if e.entity_type == "lab":
            key = (e.display or "").strip().lower()
            lab_map.setdefault(key, []).append({
                "date": e.onset_date or "",
                "numeric": _parse_numeric(e.value),
                "raw": e.value or "",
            })
    for key in lab_map:
        lab_map[key].sort(key=lambda x: x["date"])

    def _find_lab(keywords: list[str]) -> list | None:
        for k, v in lab_map.items():
            if any(kw in k for kw in keywords):
                return v
        return None

    # ── eGFR ──────────────────────────────────────────────────────────────────
    egfr = _find_lab(["egfr", "glomerular filtration"])
    if egfr:
        nums = [r["numeric"] for r in egfr if r["numeric"] is not None]
        if nums:
            latest = nums[-1]
            if latest < 30:
                flags.append(f"eGFR critically low ({latest:.0f} mL/min) — CKD Stage 4–5, nephrology referral warranted")
                level = "critical"
            elif latest < 45:
                flags.append(f"eGFR below 45 ({latest:.0f} mL/min) — CKD Stage 3b")
                if level == "stable":
                    level = "watch"
            if len(nums) >= 2:
                # annualised decline across full reading span
                annual_decline = (nums[0] - nums[-1]) / max(len(nums) - 1, 1)
                if annual_decline > 10:
                    flags.append(f"eGFR declining rapidly (~{annual_decline:.0f} mL/min/yr) — urgent nephrology review")
                    level = "critical"
                elif annual_decline > 5:
                    flags.append(f"eGFR declining (~{annual_decline:.0f} mL/min/yr) — monitor closely")
                    if level == "stable":
                        level = "watch"

    # ── HbA1c ─────────────────────────────────────────────────────────────────
    hba1c = _find_lab(["hba1c", "hemoglobin a1c", "glycated", "glycosylated"])
    if hba1c:
        nums = [r["numeric"] for r in hba1c if r["numeric"] is not None]
        if nums:
            latest = nums[-1]
            if latest >= 9.0:
                flags.append(f"HbA1c critically elevated ({latest:.1f}%) — glycemic control failure")
                level = "critical"
            elif latest >= 8.0:
                flags.append(f"HbA1c above target ({latest:.1f}%) — intensification indicated")
                if level == "stable":
                    level = "watch"
            if len(nums) >= 2 and nums[-1] - nums[-2] >= 0.5:
                flags.append(f"HbA1c worsening (+{nums[-1] - nums[-2]:.1f}% vs previous reading)")
                if level == "stable":
                    level = "watch"

    # ── Creatinine trend ──────────────────────────────────────────────────────
    creatinine = _find_lab(["creatinine"])
    if creatinine:
        nums = [r["numeric"] for r in creatinine if r["numeric"] is not None]
        if len(nums) >= 2 and nums[-1] > nums[0] * 1.3 and nums[-1] > 1.4:
            flags.append(f"Creatinine rising ({nums[0]:.1f} → {nums[-1]:.1f} mg/dL — {((nums[-1]/nums[0]-1)*100):.0f}% increase)")
            if level == "stable":
                level = "watch"

    # ── NT-proBNP / BNP ───────────────────────────────────────────────────────
    bnp = _find_lab(["bnp", "pro-bnp", "probnp", "natriuretic"])
    if bnp:
        nums = [r["numeric"] for r in bnp if r["numeric"] is not None]
        if nums and nums[-1] > 900:
            flags.append(f"NT-proBNP elevated ({nums[-1]:.0f} pg/mL) — heart failure decompensation risk")
            if level == "stable":
                level = "watch"

    # ── Condition-medication gap analysis ─────────────────────────────────────
    active_conditions = {
        (e.display or "").lower()
        for e in ents
        if e.entity_type == "condition" and e.status in ("active", "confirmed")
    }
    active_meds_lower = {
        (e.display or "").lower()
        for e in ents
        if e.entity_type == "medication" and e.status == "active"
    }

    has_ckd = any("kidney" in c or "renal" in c or "ckd" in c or "nephrop" in c for c in active_conditions)

    _ace_arb_names = ["lisinopril", "enalapril", "ramipril", "perindopril",
                      "losartan", "valsartan", "irbesartan", "candesartan", "olmesartan"]
    has_ace_arb = any(any(d in m for d in _ace_arb_names) for m in active_meds_lower)

    if has_ckd and not has_ace_arb:
        flags.append("CKD documented — no ACE inhibitor or ARB detected in active medications")
        if level == "stable":
            level = "watch"

    if not flags:
        flags = ["No significant risk indicators detected in current data"]

    return {
        "level": level,
        "flags": flags,
        "flag_count": sum(1 for f in flags if "No significant" not in f),
    }


# ─── Core sync function ───────────────────────────────────────────────────────

async def sync_patient(fhir_patient_id: str, db: AsyncSession) -> Patient:
    """
    Pull all FHIR resources for a patient and upsert into local DB.
    Returns the Patient ORM object.
    """
    fhir_resource = await fhir.get_patient(fhir_patient_id)
    if not fhir_resource:
        raise ValueError(f"Patient {fhir_patient_id} not found in FHIR server")

    result = await db.execute(select(Patient).where(Patient.fhir_id == fhir_patient_id))
    patient = result.scalar_one_or_none()

    if not patient:
        patient = Patient(fhir_id=fhir_patient_id)
        db.add(patient)

    patient.full_name  = _patient_name(fhir_resource)
    patient.birth_date = fhir_resource.get("birthDate", "")
    patient.gender     = fhir_resource.get("gender", "")
    patient.mrn        = _patient_mrn(fhir_resource)
    patient.synced_at  = datetime.utcnow()
    await db.flush()

    # Delete existing entities and re-sync
    await db.execute(delete(PatientEntity).where(PatientEntity.patient_id == patient.id))

    conditions  = await fhir.get_conditions(fhir_patient_id)
    medications = await fhir.get_medications(fhir_patient_id)
    labs        = await fhir.get_observations(fhir_patient_id, "laboratory")
    allergies   = await fhir.get_allergies(fhir_patient_id)
    encounters  = await fhir.get_encounters_for_patient(fhir_patient_id)

    raw_entities = (
        [_condition_to_entity(patient.id, r) for r in conditions]
        + [_medication_to_entity(patient.id, r) for r in medications]
        + [_observation_to_entity(patient.id, r) for r in labs]
        + [_allergy_to_entity(patient.id, r) for r in allergies]
        + [_encounter_to_entity(patient.id, r) for r in encounters]
    )

    # Deduplicate: FHIR may have duplicate resources if seed was run multiple times.
    # Keep the first occurrence of each (entity_type, code, display, onset_date) combo.
    seen: set[tuple] = set()
    entities = []
    for e in raw_entities:
        key = (e.entity_type, e.code or "", e.display or "", e.onset_date or "")
        if key not in seen:
            seen.add(key)
            entities.append(e)

    db.add_all(entities)
    await db.commit()
    await db.refresh(patient)
    return patient


# ─── Query helpers ────────────────────────────────────────────────────────────

async def get_patient_summary(fhir_patient_id: str, db: AsyncSession) -> dict | None:
    """
    Returns a structured summary of a patient's memory.
    Used by the API and by the LangGraph FHIR agent for context injection.
    """
    result = await db.execute(
        select(Patient)
        .where(Patient.fhir_id == fhir_patient_id)
        .options(selectinload(Patient.entities))
    )
    patient = result.scalar_one_or_none()
    if not patient:
        return None

    ents = patient.entities
    by_type = {}
    for e in ents:
        by_type.setdefault(e.entity_type, []).append({
            "display": e.display,
            "status":  e.status,
            "date":    e.onset_date,
            "value":   e.value,
            "code":    e.code,
        })

    # Sort labs by date ascending so frontend can render time series correctly
    labs = sorted(by_type.get("lab", []), key=lambda x: x["date"] or "")

    # Build lab trends: group by display name, collect (date, value) pairs
    lab_trends = {}
    for lab in labs:
        name = lab["display"]
        if name not in lab_trends:
            lab_trends[name] = []
        lab_trends[name].append({"date": lab["date"], "value": lab["value"]})

    # Only include labs with 2+ readings in trends summary (for AI context)
    trend_summary = {
        name: readings
        for name, readings in lab_trends.items()
        if len(readings) >= 2
    }

    risk = _compute_risk(ents)

    return {
        "fhir_id":    patient.fhir_id,
        "full_name":  patient.full_name,
        "birth_date": patient.birth_date,
        "gender":     patient.gender,
        "mrn":        patient.mrn,
        "synced_at":  patient.synced_at.isoformat() if patient.synced_at else None,
        "conditions":  by_type.get("condition", []),
        "medications": by_type.get("medication", []),
        "labs":        labs,
        "lab_trends":  trend_summary,
        "allergies":   by_type.get("allergy", []),
        "encounters":  by_type.get("encounter", []),
        "risk":        risk,
    }


async def list_patients(db: AsyncSession) -> list[dict]:
    """
    Returns all synced patients with a compact summary (for the patient list screen).
    """
    result = await db.execute(
        select(Patient).options(selectinload(Patient.entities))
    )
    patients = result.scalars().all()

    summaries = []
    for p in patients:
        ents = p.entities
        active_conditions = [
            e.display for e in ents
            if e.entity_type == "condition" and e.status in ("active", "confirmed")
        ][:3]
        active_meds = [
            e.display for e in ents
            if e.entity_type == "medication" and e.status == "active"
        ][:3]
        last_encounter = next(
            (e.onset_date for e in sorted(ents, key=lambda x: x.onset_date or "", reverse=True)
             if e.entity_type == "encounter"), None
        )
        summaries.append({
            "fhir_id":          p.fhir_id,
            "full_name":        p.full_name,
            "birth_date":       p.birth_date,
            "gender":           p.gender,
            "mrn":              p.mrn,
            "active_conditions": active_conditions,
            "active_medications": active_meds,
            "last_encounter":   last_encounter,
            "entity_counts": {
                "conditions":  sum(1 for e in ents if e.entity_type == "condition"),
                "medications": sum(1 for e in ents if e.entity_type == "medication"),
                "labs":        sum(1 for e in ents if e.entity_type == "lab"),
                "allergies":   sum(1 for e in ents if e.entity_type == "allergy"),
            },
            "risk": _compute_risk(ents),
        })
    return summaries
