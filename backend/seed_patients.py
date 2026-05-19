"""
Seed 10 realistic synthetic patients into the FHIR server and sync to PostgreSQL.
Run once: python seed_patients.py

Uses the configured FHIR_BASE_URL (defaults to http://localhost:8080/fhir).
For a live demo, point FHIR_BASE_URL at a hosted HAPI FHIR server.
"""

import asyncio
import os
import sys
import httpx

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

FHIR_BASE = os.getenv("FHIR_BASE_URL", "http://localhost:8080/fhir")
HEADERS = {"Content-Type": "application/fhir+json", "Accept": "application/fhir+json"}

PATIENTS = [
    {
        "family": "Johnson", "given": "Margaret", "birth_date": "1957-03-14",
        "gender": "female", "mrn": "MRN-001",
        "conditions": [
            ("44054006",  "Type 2 Diabetes Mellitus",    "active"),
            ("38341003",  "Hypertension",                 "active"),
            ("709044004", "Chronic Kidney Disease Stage 3", "active"),
            ("44054006",  "Hyperlipidemia",               "active"),
        ],
        "medications": [
            ("860975",  "Metformin 500mg",       "active",  "2020-01-15"),
            ("308460",  "Lisinopril 10mg",        "active",  "2019-06-01"),
            ("859751",  "Atorvastatin 20mg",      "active",  "2021-03-10"),
            ("197381",  "Amlodipine 5mg",         "active",  "2022-01-20"),
        ],
        "labs": [
            ("4548-4",  "Hemoglobin A1c",         "7.8 %",   "2024-11-01"),
            ("2160-0",  "Creatinine",              "1.6 mg/dL","2024-11-01"),
            ("33914-3", "eGFR",                   "42 mL/min","2024-11-01"),
            ("2093-3",  "Total Cholesterol",       "198 mg/dL","2024-10-15"),
        ],
        "allergies": [("372687004", "Penicillin", "high")],
    },
    {
        "family": "Williams", "given": "Robert", "birth_date": "1965-08-22",
        "gender": "male", "mrn": "MRN-002",
        "conditions": [
            ("22298006",  "Myocardial Infarction (history)", "resolved"),
            ("84114007",  "Heart Failure",                   "active"),
            ("38341003",  "Hypertension",                    "active"),
            ("40275004",  "Atrial Fibrillation",             "active"),
        ],
        "medications": [
            ("308460",  "Lisinopril 5mg",     "active", "2022-03-01"),
            ("200033",  "Carvedilol 12.5mg",  "active", "2022-03-01"),
            ("855332",  "Warfarin 5mg",        "active", "2022-03-15"),
            ("308439",  "Furosemide 40mg",     "active", "2022-04-01"),
        ],
        "labs": [
            ("33762-6", "NT-proBNP",           "1840 pg/mL","2024-10-20"),
            ("2160-0",  "Creatinine",           "1.2 mg/dL", "2024-10-20"),
            ("6301-6",  "INR",                  "2.3",        "2024-11-05"),
        ],
        "allergies": [("372840004", "Aspirin", "unable-to-assess")],
    },
    {
        "family": "Chen", "given": "Linda", "birth_date": "1982-11-30",
        "gender": "female", "mrn": "MRN-003",
        "conditions": [
            ("195967001", "Asthma",                    "active"),
            ("13645005",  "COPD",                      "active"),
            ("35489007",  "Major Depressive Disorder", "active"),
        ],
        "medications": [
            ("746763", "Fluticasone inhaler 250mcg", "active", "2021-05-10"),
            ("746845", "Salbutamol inhaler",          "active", "2021-05-10"),
            ("596926", "Sertraline 50mg",              "active", "2023-01-20"),
        ],
        "labs": [
            ("19926-5", "FEV1/FVC ratio", "0.62", "2024-09-15"),
            ("20150-9", "Spirometry",     "68%",   "2024-09-15"),
        ],
        "allergies": [],
    },
    {
        "family": "Patel", "given": "Raj", "birth_date": "1949-05-07",
        "gender": "male", "mrn": "MRN-004",
        "conditions": [
            ("363418001", "Prostate Cancer",       "active"),
            ("44054006",  "Type 2 Diabetes",       "active"),
            ("41991004",  "Osteoporosis",          "active"),
        ],
        "medications": [
            ("1008438", "Leuprolide 7.5mg",    "active", "2023-06-01"),
            ("860975",  "Metformin 1000mg",    "active", "2018-03-15"),
            ("1101278", "Alendronate 70mg",    "active", "2022-10-01"),
        ],
        "labs": [
            ("2857-1",  "PSA",            "8.4 ng/mL",  "2024-10-01"),
            ("4548-4",  "HbA1c",          "8.1 %",      "2024-10-01"),
            ("38483-4", "Bone Density",   "-2.8 T-score","2024-08-20"),
        ],
        "allergies": [("387207008", "Ibuprofen", "low")],
    },
    {
        "family": "Martinez", "given": "Sofia", "birth_date": "1978-02-19",
        "gender": "female", "mrn": "MRN-005",
        "conditions": [
            ("69896004",  "Rheumatoid Arthritis", "active"),
            ("36971009",  "Sjögren Syndrome",     "active"),
            ("34742003",  "Peripheral Neuropathy","active"),
        ],
        "medications": [
            ("105078",  "Methotrexate 15mg",     "active", "2020-07-01"),
            ("352053",  "Hydroxychloroquine 200mg","active","2020-07-01"),
            ("41493",   "Folic Acid 5mg",         "active", "2020-07-15"),
        ],
        "labs": [
            ("4537-7",  "ESR",        "68 mm/hr",  "2024-10-10"),
            ("14647-2", "CRP",        "12.3 mg/L", "2024-10-10"),
            ("5902-2",  "RF",         "142 IU/mL", "2024-10-10"),
        ],
        "allergies": [("372687004", "Sulfonamides", "high")],
    },
    {
        "family": "Thompson", "given": "James", "birth_date": "1971-09-03",
        "gender": "male", "mrn": "MRN-006",
        "conditions": [
            ("73211009",  "Diabetes Mellitus Type 1", "active"),
            ("193003",    "Diabetic Retinopathy",     "active"),
            ("127013003", "Diabetic Nephropathy",     "active"),
        ],
        "medications": [
            ("274783",  "Insulin Glargine 20 units",  "active", "2010-01-01"),
            ("865098",  "Insulin Aspart",             "active", "2010-01-01"),
            ("308460",  "Lisinopril 10mg",            "active", "2019-05-01"),
        ],
        "labs": [
            ("4548-4",  "HbA1c",      "9.2 %",     "2024-11-01"),
            ("2160-0",  "Creatinine", "2.1 mg/dL", "2024-11-01"),
            ("14959-1", "UACR",       "310 mg/g",  "2024-11-01"),
        ],
        "allergies": [],
    },
    {
        "family": "Davis", "given": "Patricia", "birth_date": "1955-12-28",
        "gender": "female", "mrn": "MRN-007",
        "conditions": [
            ("109838007", "Breast Cancer Stage II",  "active"),
            ("56717001",  "Hypothyroidism",          "active"),
            ("73211009",  "Anxiety Disorder",        "active"),
        ],
        "medications": [
            ("1150931", "Tamoxifen 20mg",    "active", "2023-02-01"),
            ("10582",   "Levothyroxine 75mcg","active","2015-06-01"),
            ("596926",  "Escitalopram 10mg", "active", "2023-03-15"),
        ],
        "labs": [
            ("85319-2", "CA 15-3",         "28 U/mL",   "2024-10-15"),
            ("3024-7",  "Thyroid TSH",     "3.2 mIU/L", "2024-10-15"),
        ],
        "allergies": [("255641001", "Codeine", "high")],
    },
    {
        "family": "Brown", "given": "Michael", "birth_date": "1988-06-14",
        "gender": "male", "mrn": "MRN-008",
        "conditions": [
            ("24700007",  "Multiple Sclerosis",       "active"),
            ("35489007",  "Depression",               "active"),
            ("57676002",  "Joint Pain",               "active"),
        ],
        "medications": [
            ("1186723", "Dimethyl Fumarate 240mg", "active", "2021-09-01"),
            ("596926",  "Venlafaxine 75mg",         "active", "2022-05-01"),
            ("41493",   "Vitamin D3 2000 IU",        "active", "2021-09-01"),
        ],
        "labs": [
            ("26484-6", "MRI lesion count",    "4 lesions",  "2024-09-01"),
            ("14647-2", "CRP",                 "2.1 mg/L",   "2024-09-15"),
        ],
        "allergies": [],
    },
    {
        "family": "Garcia", "given": "Elena", "birth_date": "1943-04-25",
        "gender": "female", "mrn": "MRN-009",
        "conditions": [
            ("49436004",  "Atrial Fibrillation",           "active"),
            ("90688005",  "Chronic Renal Failure",         "active"),
            ("44054006",  "Type 2 Diabetes",               "active"),
            ("191415002", "Vascular Dementia (early)",     "active"),
        ],
        "medications": [
            ("1992427", "Apixaban 5mg",      "active", "2021-01-10"),
            ("860975",  "Metformin 500mg",   "active", "2015-03-01"),
            ("308460",  "Ramipril 5mg",      "active", "2019-07-01"),
        ],
        "labs": [
            ("4548-4",  "HbA1c",      "7.4 %",     "2024-10-20"),
            ("2160-0",  "Creatinine", "2.8 mg/dL", "2024-10-20"),
            ("33914-3", "eGFR",       "22 mL/min", "2024-10-20"),
            ("6301-6",  "INR",        "2.1",        "2024-11-01"),
        ],
        "allergies": [("372687004", "Penicillin", "high"), ("387207008", "NSAIDs", "unable-to-assess")],
    },
    {
        "family": "Lee", "given": "David", "birth_date": "1975-07-08",
        "gender": "male", "mrn": "MRN-010",
        "conditions": [
            ("13200003",  "Crohn Disease",            "active"),
            ("59621000",  "Iron Deficiency Anemia",   "active"),
            ("193001",    "Vitamin B12 Deficiency",   "active"),
        ],
        "medications": [
            ("1165185", "Adalimumab 40mg",     "active", "2022-08-01"),
            ("1046609", "Azathioprine 100mg",  "active", "2022-08-01"),
            ("315430",  "Ferrous Sulfate 325mg","active","2023-01-15"),
        ],
        "labs": [
            ("26436-6", "CBC",            "Hgb 9.8 g/dL", "2024-11-01"),
            ("2498-4",  "Iron",           "38 mcg/dL",     "2024-11-01"),
            ("2132-9",  "Vitamin B12",    "148 pg/mL",     "2024-11-01"),
            ("14647-2", "CRP",            "18.4 mg/L",     "2024-11-01"),
        ],
        "allergies": [("372840004", "Mesalamine", "unable-to-assess")],
    },
]


async def post_fhir(client: httpx.AsyncClient, path: str, body: dict) -> dict:
    resp = await client.post(f"{FHIR_BASE}/{path}", json=body, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    return resp.json()


async def upsert_patient(client: httpx.AsyncClient, p: dict) -> str:
    """
    Search by MRN first. If duplicates exist, delete extras and PUT to the
    surviving ID. If none exist, POST to create. Returns the FHIR patient id.
    """
    mrn = p["mrn"]
    resource = {
        "resourceType": "Patient",
        "identifier": [{"use": "official", "value": mrn}],
        "name": [{"use": "official", "family": p["family"], "given": [p["given"]]}],
        "gender": p["gender"],
        "birthDate": p["birth_date"],
    }

    # Search for existing patients with this MRN
    search_resp = await client.get(
        f"{FHIR_BASE}/Patient",
        params={"identifier": mrn, "_elements": "id"},
        headers=HEADERS,
        timeout=20,
    )
    search_resp.raise_for_status()
    entries = search_resp.json().get("entry", [])
    ids = [e["resource"]["id"] for e in entries if "resource" in e]

    if ids:
        # Delete all duplicates except the first
        for extra_id in ids[1:]:
            await client.delete(f"{FHIR_BASE}/Patient/{extra_id}", headers=HEADERS, timeout=20)
        # Update the surviving one directly by ID
        resource["id"] = ids[0]
        put_resp = await client.put(
            f"{FHIR_BASE}/Patient/{ids[0]}",
            json=resource,
            headers=HEADERS,
            timeout=20,
        )
        put_resp.raise_for_status()
        return ids[0]
    else:
        # No existing patient — create fresh
        post_resp = await client.post(f"{FHIR_BASE}/Patient", json=resource, headers=HEADERS, timeout=20)
        post_resp.raise_for_status()
        return post_resp.json()["id"]


async def seed():
    print(f"Seeding patients to FHIR server: {FHIR_BASE}\n")

    async with httpx.AsyncClient() as client:
        for p in PATIENTS:
            print(f"Upserting {p['given']} {p['family']}...", end=" ")

            pid = await upsert_patient(client, p)

            for code, display, status in p["conditions"]:
                await post_fhir(client, "Condition", {
                    "resourceType": "Condition",
                    "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": status}]},
                    "code": {"coding": [{"system": "http://snomed.info/sct", "code": code, "display": display}], "text": display},
                    "subject": {"reference": f"Patient/{pid}"},
                })

            for rxcode, display, status, date in p["medications"]:
                await post_fhir(client, "MedicationRequest", {
                    "resourceType": "MedicationRequest",
                    "status": status,
                    "intent": "order",
                    "medicationCodeableConcept": {
                        "coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": rxcode, "display": display}],
                        "text": display,
                    },
                    "subject": {"reference": f"Patient/{pid}"},
                    "authoredOn": date,
                })

            for lcode, display, value, date in p["labs"]:
                await post_fhir(client, "Observation", {
                    "resourceType": "Observation",
                    "status": "final",
                    "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "laboratory"}]}],
                    "code": {"coding": [{"system": "http://loinc.org", "code": lcode, "display": display}], "text": display},
                    "subject": {"reference": f"Patient/{pid}"},
                    "effectiveDateTime": date,
                    "valueString": value,
                })

            for acode, display, criticality in p["allergies"]:
                await post_fhir(client, "AllergyIntolerance", {
                    "resourceType": "AllergyIntolerance",
                    "clinicalStatus": {
                        "coding": [{"system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", "code": "active"}]
                    },
                    "verificationStatus": {
                        "coding": [{"system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification", "code": "confirmed"}]
                    },
                    "criticality": criticality,
                    "code": {"coding": [{"system": "http://snomed.info/sct", "code": acode, "display": display}], "text": display},
                    "patient": {"reference": f"Patient/{pid}"},
                })

            print(f"done (FHIR id: {pid})")

    print("\nAll patients seeded. Now run: python -c \"import asyncio; from patient_memory import sync_patient; ...\" or use the /patients/sync endpoint.")


if __name__ == "__main__":
    asyncio.run(seed())
