"""
ClinicalTrials.gov API v2 integration.
Free, no API key required.
Returns active, recruiting, and completed trials for a given query.
"""

import httpx
from typing import Optional

CT_BASE = "https://clinicaltrials.gov/api/v2/studies"

FIELDS = [
    "NCTId", "BriefTitle", "OfficialTitle", "OverallStatus",
    "Phase", "StudyType", "BriefSummary", "DetailedDescription",
    "EnrollmentCount", "StartDate", "CompletionDate",
    "PrimaryOutcomeMeasure", "SecondaryOutcomeMeasure",
    "InterventionName", "InterventionType",
    "Condition", "LeadSponsorName",
]


async def search_clinical_trials(query: str, max_results: int = 5) -> list[dict]:
    """Search ClinicalTrials.gov and return structured trial data."""
    params = {
        "query.term": query,
        "filter.overallStatus": "COMPLETED,ACTIVE_NOT_RECRUITING,TERMINATED",
        "fields": "|".join(FIELDS),
        "pageSize": max_results,
        "sort": "@relevance",
        "format": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(CT_BASE, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        print(f"ClinicalTrials HTTP error: {e}")
        return []
    except Exception as e:
        print(f"ClinicalTrials unexpected error: {e}")
        return []

    studies = data.get("studies", [])
    return [parse_trial(s) for s in studies]


def parse_trial(study: dict) -> dict:
    """Parse a single ClinicalTrials.gov study into a flat dict."""
    ps = study.get("protocolSection", {})
    id_mod      = ps.get("identificationModule", {})
    status_mod  = ps.get("statusModule", {})
    desc_mod    = ps.get("descriptionModule", {})
    design_mod  = ps.get("designModule", {})
    outcomes    = ps.get("outcomesModule", {})
    arms        = ps.get("armsInterventionsModule", {})
    sponsor_mod = ps.get("sponsorCollaboratorsModule", {})
    cond_mod    = ps.get("conditionsModule", {})

    nct_id = id_mod.get("nctId", "N/A")

    # Interventions
    interventions = arms.get("interventions", [])
    intervention_names = ", ".join(
        i.get("name", "") for i in interventions[:3] if i.get("name")
    ) or "N/A"

    # Primary outcomes
    primary_outcomes = outcomes.get("primaryOutcomes", [])
    primary_outcome_text = "; ".join(
        o.get("measure", "") for o in primary_outcomes[:2] if o.get("measure")
    ) or "N/A"

    # Conditions
    conditions = cond_mod.get("conditions", [])
    condition_text = ", ".join(conditions[:3]) if conditions else "N/A"

    # Enrollment
    enrollment = design_mod.get("enrollmentInfo", {}).get("count", "N/A")

    # Phase
    phases = design_mod.get("phases", [])
    phase = ", ".join(phases) if phases else "N/A"

    # Abstract-style summary
    brief = desc_mod.get("briefSummary", "No summary available.").strip()

    return {
        "pmid": nct_id,                       # reuse pmid field for consistency
        "source": "ClinicalTrials.gov",
        "title": id_mod.get("briefTitle", id_mod.get("officialTitle", "No title")),
        "authors": sponsor_mod.get("leadSponsor", {}).get("name", "Unknown sponsor"),
        "journal": f"ClinicalTrials.gov · {phase}",
        "year": (status_mod.get("completionDateStruct", {}) or
                 status_mod.get("startDateStruct", {})).get("date", "N/A")[:4],
        "url": f"https://clinicaltrials.gov/study/{nct_id}",
        "abstract": brief,
        "status": status_mod.get("overallStatus", "Unknown"),
        "enrollment": str(enrollment),
        "intervention": intervention_names,
        "condition": condition_text,
        "primary_outcome": primary_outcome_text,
        "phase": phase,
        "is_trial": True,
    }
