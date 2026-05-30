"""
CDS Hooks integration — HL7 CDS Hooks 2.0

Exposes two hooks:
  patient-view   fires when a clinician opens a patient chart
  order-sign     fires when a clinician signs a new medication order

Discovery: GET  /.well-known/cds-services
patient-view:   POST /cds-hooks/patient-view
order-sign:     POST /cds-hooks/order-sign

The EHR sends a prefetch bundle; we return a cards array.  If the patient
exists in our local memory we surface the most relevant recent insight as
a suggestion card.  If not, we return an empty cards list (no noise).
"""

import os
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


# ─── CDS Hooks payload schemas ───────────────────────────────────────────────

class CDSHookContext(BaseModel):
    patientId: Optional[str] = None
    userId:    Optional[str] = None
    encounterId: Optional[str] = None
    # order-sign specific
    draftOrders: Optional[dict] = None


class CDSHookRequest(BaseModel):
    hookInstance: str
    hook:         str
    context:      dict
    prefetch:     Optional[dict] = None
    fhirServer:   Optional[str] = None


# ─── Discovery endpoint ──────────────────────────────────────────────────────

@router.get("/.well-known/cds-services")
async def cds_discovery():
    """
    HL7 CDS Hooks discovery endpoint.
    Returns the list of services this server provides.
    """
    return {
        "services": [
            {
                "hook":        "patient-view",
                "id":          "clinicalmind-patient-view",
                "title":       "ClinicalMind Evidence Insights",
                "description": (
                    "Surfaces relevant clinical evidence insights from ClinicalMind "
                    "when a patient chart is opened. Highlights prior evidence queries "
                    "and flags any unreviewed high-confidence recommendations."
                ),
                "prefetch": {
                    "patient": "Patient/{{context.patientId}}",
                },
            },
            {
                "hook":        "order-sign",
                "id":          "clinicalmind-order-sign",
                "title":       "ClinicalMind Drug Interaction Check",
                "description": (
                    "Checks a newly signed medication order against the patient's "
                    "current medications using ClinicalMind's drug interaction agent. "
                    "Returns a warning card if a major interaction is detected."
                ),
                "prefetch": {
                    "patient":      "Patient/{{context.patientId}}",
                    "medications":  "MedicationRequest?patient={{context.patientId}}&status=active",
                },
            },
        ]
    }


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _app_base() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173")

def _api_base() -> str:
    return os.getenv("BACKEND_SELF_URL", "http://localhost:8000")

def _fhir_id_from_prefetch(prefetch: dict) -> Optional[str]:
    """Extract patient FHIR id from the prefetch bundle."""
    try:
        return prefetch.get("patient", {}).get("id")
    except Exception:
        return None

def _format_date(iso: Optional[str]) -> str:
    if not iso:
        return "unknown date"
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y")
    except Exception:
        return iso[:10]

def _top_recommendations(insight: dict, n: int = 3) -> list[str]:
    recs = insight.get("recommendations") or []
    return [r.get("recommendation", "") for r in recs[:n] if r.get("recommendation")]


# ─── patient-view hook ────────────────────────────────────────────────────────

@router.post("/cds-hooks/patient-view")
async def cds_patient_view(body: CDSHookRequest):
    """
    Fires when a clinician opens a patient chart.
    Returns up to two cards:
      1. If the patient has prior ClinicalMind insights: a summary card
         linking back to the most recent one.
      2. If the patient has high-confidence recommendations that haven't been
         reviewed in >30 days: a reminder card.
    """
    import httpx

    patient_id = (body.prefetch or {}).get("patient", {}).get("id") \
        or body.context.get("patientId")

    if not patient_id:
        return {"cards": []}

    # Fetch insights from our own API — keeps logic in one place
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{_api_base()}/patients/{patient_id}/insights?limit=5")
        if resp.status_code != 200:
            return {"cards": []}
        insights = resp.json().get("insights", [])
    except Exception:
        return {"cards": []}

    if not insights:
        return {"cards": []}

    cards = []
    latest = insights[0]

    # Card 1 — most recent insight summary
    top_recs = _top_recommendations(latest)
    summary_lines = "\n".join(f"• {r}" for r in top_recs) if top_recs else "No recommendations on record."

    cards.append({
        "summary":   f"ClinicalMind: {len(insights)} prior evidence quer{'y' if len(insights) == 1 else 'ies'} for this patient",
        "indicator": "info",
        "detail":    (
            f"**Most recent query** ({_format_date(latest.get('created_at'))}):\n"
            f"_{latest.get('question', 'Clinical question')}_\n\n"
            f"**Top recommendations:**\n{summary_lines}"
        ),
        "source": {
            "label": "ClinicalMind",
            "url":   _app_base(),
            "icon":  f"{_app_base()}/favicon.ico",
        },
        "links": [
            {
                "label":   "Open in ClinicalMind",
                "url":     f"{_app_base()}/?job={latest.get('job_id')}",
                "type":    "absolute",
            },
            {
                "label":   "View all insights",
                "url":     f"{_app_base()}/?patient={patient_id}&tab=workspace",
                "type":    "absolute",
            },
        ],
    })

    # Card 2 — stale high-confidence recommendation reminder (>30 days old)
    high_conf = [
        i for i in insights
        if any(
            r.get("confidence_score", 0) >= 75
            for r in (i.get("recommendations") or [])
        )
    ]
    if high_conf:
        oldest = high_conf[-1]
        created = oldest.get("created_at", "")
        try:
            age_days = (datetime.now(timezone.utc) - datetime.fromisoformat(
                created.replace("Z", "+00:00")
            )).days
        except Exception:
            age_days = 0

        if age_days > 30:
            cards.append({
                "summary":   f"High-confidence recommendation from {age_days} days ago — consider review",
                "indicator": "warning",
                "detail":    (
                    "ClinicalMind previously identified high-confidence recommendations "
                    f"for this patient ({_format_date(created)}). "
                    "Clinical evidence may have been updated since then."
                ),
                "source": {
                    "label": "ClinicalMind",
                    "url":   _app_base(),
                },
                "links": [
                    {
                        "label": "Review recommendations",
                        "url":   f"{_app_base()}/?job={oldest.get('job_id')}",
                        "type":  "absolute",
                    }
                ],
            })

    return {"cards": cards}


# ─── order-sign hook ──────────────────────────────────────────────────────────

@router.post("/cds-hooks/order-sign")
async def cds_order_sign(body: CDSHookRequest):
    """
    Fires when a clinician signs a new medication order.
    Extracts the new drug name from draftOrders, fetches current meds from
    the prefetch, runs a rule-based interaction check, and returns a warning
    card for any major interactions detected.
    """
    draft_orders = body.context.get("draftOrders") or {}

    # Extract new drug name(s) from the draft MedicationRequest bundle
    new_drugs: list[str] = []
    for entry in draft_orders.get("entry", []):
        res = entry.get("resource", {})
        if res.get("resourceType") != "MedicationRequest":
            continue
        med_concept = res.get("medicationCodeableConcept") or {}
        name = med_concept.get("text") or ""
        if not name:
            for coding in med_concept.get("coding", []):
                name = coding.get("display") or coding.get("code") or ""
                if name:
                    break
        if name:
            new_drugs.append(name)

    if not new_drugs:
        return {"cards": []}

    # Extract current medications from prefetch bundle
    current_meds: list[str] = []
    med_bundle = (body.prefetch or {}).get("medications", {})
    for entry in med_bundle.get("entry", []):
        res = entry.get("resource", {})
        if res.get("resourceType") != "MedicationRequest":
            continue
        med_concept = res.get("medicationCodeableConcept") or {}
        name = med_concept.get("text") or ""
        if not name:
            for coding in med_concept.get("coding", []):
                name = coding.get("display") or coding.get("code") or ""
                if name:
                    break
        if name:
            current_meds.append(name)

    if not current_meds:
        return {"cards": []}

    # Run rule-based interaction check (same logic as the drug_interaction agent)
    from agents import _check_rule_based
    new_drugs_text = ", ".join(new_drugs)
    interactions = _check_rule_based(current_meds, new_drugs_text)
    major = [i for i in interactions if i.get("severity") == "major"]

    if not major:
        return {"cards": []}

    cards = []
    for interaction in major:
        cards.append({
            "summary":   f"Major drug interaction: {interaction.get('new_drug', new_drugs_text)} + {interaction.get('existing_drug', '?')}",
            "indicator": "critical",
            "detail":    (
                f"**Interaction detected by ClinicalMind**\n\n"
                f"{interaction.get('description', 'Potential major drug interaction. Review before signing.')}\n\n"
                f"**Mechanism:** {interaction.get('mechanism', 'See full evidence report.')}"
            ),
            "source": {
                "label": "ClinicalMind Drug Interaction Agent",
                "url":   _app_base(),
            },
            "links": [
                {
                    "label": "Search evidence for this combination",
                    "url":   (
                        f"{_app_base()}/?q="
                        + "+".join(new_drugs_text.split())
                        + "+drug+interaction"
                    ),
                    "type": "absolute",
                }
            ],
        })

    return {"cards": cards}
