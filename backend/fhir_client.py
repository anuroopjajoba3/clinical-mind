"""
FHIR R4 Client — reads and writes Patient, Encounter, and Appointment resources
against a HAPI FHIR server (or any FHIR R4-compliant server).

This is exactly the integration pattern Commure's Integration Team uses to
fetch/push data between their platform and hospital EMRs.
"""

import os
import json
import httpx
from datetime import datetime
from typing import Optional

def _fhir_base() -> str:
    return os.getenv("FHIR_BASE_URL", "http://localhost:8080/fhir")

# Module-level alias kept for backward compat (fhir.FHIR_BASE used in health endpoint)
FHIR_BASE = os.getenv("FHIR_BASE_URL", "http://localhost:8080/fhir")

HEADERS = {
    "Content-Type": "application/fhir+json",
    "Accept": "application/fhir+json",
}


# ─── helpers ────────────────────────────────────────────────────────────────

def _raise_for_status(resp: httpx.Response, context: str):
    if resp.status_code >= 400:
        raise RuntimeError(
            f"FHIR {context} failed [{resp.status_code}]: {resp.text[:400]}"
        )


# ════════════════════════════════════════════════════════════════════════════
# PATIENT
# ════════════════════════════════════════════════════════════════════════════

async def create_patient(
    family: str,
    given: str,
    birth_date: str,               # "YYYY-MM-DD"
    gender: str = "unknown",       # male | female | other | unknown
    mrn: Optional[str] = None,     # Medical Record Number
) -> dict:
    """
    POST /Patient — write a new patient to the FHIR server.
    Returns the created Patient resource (with server-assigned id).
    """
    resource = {
        "resourceType": "Patient",
        "identifier": [
            {
                "use": "official",
                "system": "urn:oid:2.16.840.1.113883.4.1",  # MRN system
                "value": mrn or f"MRN-{family.upper()}-{birth_date}",
            }
        ],
        "name": [{"use": "official", "family": family, "given": [given]}],
        "gender": gender,
        "birthDate": birth_date,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(f"{_fhir_base()}/Patient", json=resource, headers=HEADERS)
    _raise_for_status(resp, "create Patient")
    return resp.json()


async def get_patient(patient_id: str) -> Optional[dict]:
    """GET /Patient/{id} — returns None if the patient is not found (404)."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{_fhir_base()}/Patient/{patient_id}", headers=HEADERS)
    if resp.status_code == 404:
        return None
    _raise_for_status(resp, "get Patient")
    return resp.json()


async def search_patients(family: str = "", given: str = "", mrn: str = "") -> list[dict]:
    """
    GET /Patient?name=...&identifier=... — search patients by name or MRN.
    Returns list of Patient resources.
    """
    params: dict = {}
    if family:
        params["family"] = family
    if given:
        params["given"] = given
    if mrn:
        params["identifier"] = mrn
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{_fhir_base()}/Patient", params=params, headers=HEADERS)
    _raise_for_status(resp, "search Patient")
    bundle = resp.json()
    return [entry["resource"] for entry in bundle.get("entry", [])]


# ════════════════════════════════════════════════════════════════════════════
# ENCOUNTER
# ════════════════════════════════════════════════════════════════════════════

async def create_encounter(
    patient_id: str,
    reason: str,
    start: str,                    # ISO datetime "2025-01-15T09:00:00"
    end: Optional[str] = None,
    status: str = "finished",      # planned | in-progress | finished | cancelled
    encounter_class: str = "AMB",  # AMB=ambulatory, IMP=inpatient, EMER=emergency
) -> dict:
    """
    POST /Encounter — record a patient encounter (clinic visit, hospital stay, etc.)
    """
    period: dict = {"start": start}
    if end:
        period["end"] = end

    resource = {
        "resourceType": "Encounter",
        "status": status,
        "class": {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": encounter_class,
        },
        "subject": {"reference": f"Patient/{patient_id}"},
        "period": period,
        "reasonCode": [
            {
                "text": reason,
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "display": reason,
                    }
                ],
            }
        ],
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(f"{_fhir_base()}/Encounter", json=resource, headers=HEADERS)
    _raise_for_status(resp, "create Encounter")
    return resp.json()


async def get_encounters_for_patient(patient_id: str) -> list[dict]:
    """GET /Encounter?subject=Patient/{id} — fetch all encounters for a patient."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{_fhir_base()}/Encounter",
            params={"subject": f"Patient/{patient_id}", "_sort": "-date", "_count": "20"},
            headers=HEADERS,
        )
    _raise_for_status(resp, "search Encounter")
    bundle = resp.json()
    return [entry["resource"] for entry in bundle.get("entry", [])]


# ════════════════════════════════════════════════════════════════════════════
# APPOINTMENT
# ════════════════════════════════════════════════════════════════════════════

async def create_appointment(
    patient_id: str,
    description: str,
    start: str,                    # ISO datetime
    end: str,
    status: str = "booked",        # proposed | pending | booked | arrived | fulfilled | cancelled
    specialty: str = "General Medicine",
) -> dict:
    """
    POST /Appointment — schedule an appointment for a patient.
    """
    resource = {
        "resourceType": "Appointment",
        "status": status,
        "description": description,
        "start": start,
        "end": end,
        "specialty": [
            {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "display": specialty,
                    }
                ]
            }
        ],
        "participant": [
            {
                "actor": {"reference": f"Patient/{patient_id}"},
                "status": "accepted",
            }
        ],
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(f"{_fhir_base()}/Appointment", json=resource, headers=HEADERS)
    _raise_for_status(resp, "create Appointment")
    return resp.json()


async def get_appointments_for_patient(patient_id: str) -> list[dict]:
    """GET /Appointment?actor=Patient/{id}"""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{_fhir_base()}/Appointment",
            params={"actor": f"Patient/{patient_id}", "_sort": "-date", "_count": "20"},
            headers=HEADERS,
        )
    _raise_for_status(resp, "search Appointment")
    bundle = resp.json()
    return [entry["resource"] for entry in bundle.get("entry", [])]


# ════════════════════════════════════════════════════════════════════════════
# DOCUMENT REFERENCE  (write clinical report back to FHIR)
# ════════════════════════════════════════════════════════════════════════════

async def write_clinical_report(
    patient_id: str,
    job_id: str,
    question: str,
    report: dict,
) -> dict:
    """
    POST /DocumentReference — persists a ClinicalMind evidence report back
    to the FHIR server as a clinical document, linked to the patient.

    This mirrors the write-back pattern Commure uses to post processed
    data back to the originating EMR.
    """
    import base64

    content_text = json.dumps(report, indent=2)
    encoded = base64.b64encode(content_text.encode()).decode()
    now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    resource = {
        "resourceType": "DocumentReference",
        "status": "current",
        "type": {
            "coding": [
                {
                    "system": "http://loinc.org",
                    "code": "11488-4",
                    "display": "Consult note",
                }
            ]
        },
        "subject": {"reference": f"Patient/{patient_id}"},
        "date": now,
        "description": f"ClinicalMind Evidence Report — {question[:120]}",
        "content": [
            {
                "attachment": {
                    "contentType": "application/json",
                    "data": encoded,
                    "title": f"ClinicalMind-{job_id}.json",
                    "creation": now,
                }
            }
        ],
        "context": {
            "related": [{"display": f"Research job: {job_id}"}]
        },
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{_fhir_base()}/DocumentReference", json=resource, headers=HEADERS
        )
    _raise_for_status(resp, "write DocumentReference")
    return resp.json()


async def get_document_references(patient_id: str) -> list[dict]:
    """
    GET /DocumentReference?subject=Patient/{id}&type=11488-4
    Returns ClinicalMind evidence reports previously written back to the FHIR server
    for this patient, newest first.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{_fhir_base()}/DocumentReference",
            params={
                "subject": f"Patient/{patient_id}",
                "type":    "http://loinc.org|11488-4",
                "_sort":   "-date",
                "_count":  "20",
            },
            headers=HEADERS,
        )
    if resp.status_code >= 400:
        return []
    return [e["resource"] for e in resp.json().get("entry", [])]


# ════════════════════════════════════════════════════════════════════════════
# CONDITIONS
# ════════════════════════════════════════════════════════════════════════════

async def get_conditions(patient_id: str) -> list[dict]:
    """GET /Condition?patient={id} — active and resolved conditions."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{_fhir_base()}/Condition",
            params={"patient": patient_id, "_sort": "-onset-date", "_count": "50"},
            headers=HEADERS,
        )
    if resp.status_code >= 400:
        return []
    return [e["resource"] for e in resp.json().get("entry", [])]


# ════════════════════════════════════════════════════════════════════════════
# MEDICATIONS
# ════════════════════════════════════════════════════════════════════════════

async def get_medications(patient_id: str) -> list[dict]:
    """GET /MedicationRequest?patient={id} — current and historical medications."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{_fhir_base()}/MedicationRequest",
            params={"patient": patient_id, "_sort": "-authoredon", "_count": "50"},
            headers=HEADERS,
        )
    if resp.status_code >= 400:
        return []
    return [e["resource"] for e in resp.json().get("entry", [])]


# ════════════════════════════════════════════════════════════════════════════
# OBSERVATIONS (labs + vitals)
# ════════════════════════════════════════════════════════════════════════════

async def get_observations(patient_id: str, category: str = "laboratory") -> list[dict]:
    """GET /Observation?patient={id}&category={category} — labs or vitals."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{_fhir_base()}/Observation",
            params={"patient": patient_id, "category": category,
                    "_sort": "-date", "_count": "50"},
            headers=HEADERS,
        )
    if resp.status_code >= 400:
        return []
    return [e["resource"] for e in resp.json().get("entry", [])]


# ════════════════════════════════════════════════════════════════════════════
# ALLERGIES
# ════════════════════════════════════════════════════════════════════════════

async def get_allergies(patient_id: str) -> list[dict]:
    """GET /AllergyIntolerance?patient={id}"""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{_fhir_base()}/AllergyIntolerance",
            params={"patient": patient_id, "_count": "50"},
            headers=HEADERS,
        )
    if resp.status_code >= 400:
        return []
    return [e["resource"] for e in resp.json().get("entry", [])]


# ════════════════════════════════════════════════════════════════════════════
# SERVER HEALTH
# ════════════════════════════════════════════════════════════════════════════

async def fhir_server_healthy() -> bool:
    """Check FHIR server is up by hitting its capability statement."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{_fhir_base()}/metadata", headers=HEADERS)
        return resp.status_code == 200
    except Exception:
        return False
