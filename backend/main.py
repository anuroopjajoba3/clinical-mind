"""
ClinicalMind — Production FastAPI Backend
Auth + SSE streaming + PostgreSQL + Redis + Celery pipeline
"""

import os
import json
import asyncio
from datetime import timedelta
from typing import Optional, AsyncGenerator

import redis.asyncio as aioredis
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter, Histogram

from database import get_db, create_tables, Job, User, Patient
import fhir_client as fhir
import patient_memory as memory
from auth import (
    get_current_user, get_optional_user,
    get_user_by_email, create_user, authenticate_user,
    create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES,
)
from worker import run_pipeline, REDIS_URL
from pdf_export import generate_pdf

load_dotenv()

# ─── App ─────────────────────────────────────────────────────────────────────

# ─── Rate limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─── Custom metrics ───────────────────────────────────────────────────────────
pipeline_runs_total   = Counter("clinicalmind_pipeline_runs_total",   "Total pipeline runs", ["status"])
pipeline_duration_sec = Histogram("clinicalmind_pipeline_duration_seconds", "Pipeline duration", buckets=[5, 10, 20, 30, 60, 120])
fhir_requests_total   = Counter("clinicalmind_fhir_requests_total",   "FHIR API requests",   ["endpoint", "status"])

app = FastAPI(
    title="ClinicalMind API",
    description="Production multi-agent clinical evidence synthesis",
    version="2.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-instrument all routes (request count, latency, status codes)
Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)


@app.on_event("startup")
async def startup():
    await create_tables()


# ─── Schemas ─────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field("", max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_email: str
    user_name: str


class ResearchRequest(BaseModel):
    question: str = Field(..., min_length=10, max_length=500)
    fhir_patient_id: Optional[str] = None    # attach patient context from FHIR


class ResearchResponse(BaseModel):
    job_id: str
    message: str
    status: str


class JobResponse(BaseModel):
    job_id: str
    status: str
    question: str
    agent_status: dict
    pico: Optional[dict] = None
    summaries: Optional[list] = None
    contradictions: Optional[list] = None
    report: Optional[dict] = None
    error: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None


# ─── Auth routes ─────────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=TokenResponse, status_code=201)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, request.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    user = await create_user(db, request.email, request.password, request.full_name)
    token = create_access_token(
        {"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return TokenResponse(
        access_token=token,
        user_email=user.email,
        user_name=user.full_name or user.email.split("@")[0],
    )


@app.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    token = create_access_token(
        {"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return TokenResponse(
        access_token=token,
        user_email=user.email,
        user_name=user.full_name or user.email.split("@")[0],
    )


@app.get("/auth/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "created_at": current_user.created_at.isoformat(),
    }


# ─── Research routes ──────────────────────────────────────────────────────────

@app.post("/research", response_model=ResearchResponse, status_code=202)
@limiter.limit("10/minute")
async def start_research(
    request: Request,
    body: ResearchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY is not configured.")

    # Create job record in DB
    job = Job(
        question=body.question,
        user_id=current_user.id if current_user else None,
        status="pending",
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    job_id = str(job.id)

    # Track pipeline start
    pipeline_runs_total.labels(status="started").inc()

    # Dispatch to Celery
    run_pipeline.apply_async(
        args=[job_id, body.question],
        kwargs={"fhir_patient_id": body.fhir_patient_id},
        task_id=job_id,
    )

    return ResearchResponse(
        job_id=job_id,
        message="Pipeline started. Connect to /stream/{job_id} for real-time updates.",
        status="pending",
    )


@app.get("/stream/{job_id}")
async def stream_job(job_id: str):
    """
    Server-Sent Events endpoint.
    Polls Redis for job state updates and streams them to the client.
    Uses polling instead of pub/sub for compatibility with managed Redis (Upstash).
    """
    async def event_generator() -> AsyncGenerator[str, None]:
        _ssl = {"ssl_cert_reqs": "none"} if REDIS_URL.startswith("rediss://") else {}
        r = aioredis.from_url(REDIS_URL, decode_responses=True, **_ssl)

        last_data = None
        ticks = 0  # counts 0.5s intervals

        try:
            while ticks < 480:  # 4 min max
                cached = await r.get(f"job:{job_id}:latest")
                if cached and cached != last_data:
                    last_data = cached
                    yield f"data: {cached}\n\n"
                    try:
                        if json.loads(cached).get("status") in ("complete", "error"):
                            break
                    except json.JSONDecodeError:
                        pass
                elif ticks % 20 == 0:  # keepalive ping every ~10s
                    yield ": ping\n\n"
                ticks += 1
                await asyncio.sleep(0.5)
        finally:
            await r.aclose()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.get("/status/{job_id}", response_model=JobResponse)
async def get_status(job_id: str, db: AsyncSession = Depends(get_db)):
    """Fallback polling endpoint (also checks Redis cache for speed)."""
    # Try Redis first (fast)
    _ssl = {"ssl_cert_reqs": "none"} if REDIS_URL.startswith("rediss://") else {}
    r = aioredis.from_url(REDIS_URL, decode_responses=True, **_ssl)
    cached = await r.get(f"job:{job_id}:latest")
    await r.aclose()
    if cached:
        data = json.loads(cached)
        # Fill in missing fields from DB record if needed
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if job:
            return JobResponse(
                job_id=job_id,
                status=data.get("status", job.status),
                question=job.question,
                agent_status=data.get("agent_status", job.agent_status),
                pico=data.get("pico", job.pico),
                summaries=data.get("summaries", job.summaries),
                contradictions=data.get("contradictions", job.contradictions),
                report=data.get("report", job.report),
                error=data.get("error", job.error),
                created_at=job.created_at.isoformat(),
                completed_at=job.completed_at.isoformat() if job.completed_at else None,
            )

    # Fall back to DB
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")

    return JobResponse(
        job_id=str(job.id),
        status=job.status,
        question=job.question,
        agent_status=job.agent_status or {},
        pico=job.pico,
        summaries=job.summaries,
        contradictions=job.contradictions,
        report=job.report,
        error=job.error,
        created_at=job.created_at.isoformat(),
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
    )


# ─── History route ────────────────────────────────────────────────────────────

@app.get("/history")
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 20,
):
    result = await db.execute(
        select(Job)
        .where(Job.user_id == current_user.id)
        .order_by(desc(Job.created_at))
        .limit(limit)
    )
    jobs = result.scalars().all()
    return {
        "jobs": [
            {
                "job_id": str(j.id),
                "question": j.question[:120],
                "status": j.status,
                "created_at": j.created_at.isoformat(),
                "has_report": bool(j.report),
            }
            for j in jobs
        ]
    }


# ─── FHIR routes ─────────────────────────────────────────────────────────────
# These endpoints proxy to the HAPI FHIR R4 server, mirroring the read/write
# integration pattern used in production EMR integration platforms.

class FhirPatientCreate(BaseModel):
    family: str
    given: str
    birth_date: str           # YYYY-MM-DD
    gender: str = "unknown"
    mrn: Optional[str] = None

class FhirEncounterCreate(BaseModel):
    patient_id: str
    reason: str
    start: str                # ISO datetime
    end: Optional[str] = None
    status: str = "finished"
    encounter_class: str = "AMB"

class FhirAppointmentCreate(BaseModel):
    patient_id: str
    description: str
    start: str
    end: str
    status: str = "booked"
    specialty: str = "General Medicine"

class FhirWriteReport(BaseModel):
    patient_id: str
    job_id: str


@app.get("/fhir/health")
async def fhir_health():
    healthy = await fhir.fhir_server_healthy()
    return {"fhir_server": "up" if healthy else "down", "base_url": fhir.FHIR_BASE}


# ── Patients ──────────────────────────────────────────────────────────────────

@app.post("/fhir/patients", status_code=201)
async def create_patient(body: FhirPatientCreate):
    """POST /fhir/patients — create a new FHIR Patient resource."""
    try:
        return await fhir.create_patient(
            body.family, body.given, body.birth_date, body.gender, body.mrn
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/fhir/patients/{patient_id}")
async def get_patient(patient_id: str):
    """GET /fhir/patients/{id} — fetch a Patient by FHIR id."""
    try:
        return await fhir.get_patient(patient_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/fhir/patients")
async def search_patients(family: str = "", given: str = "", mrn: str = ""):
    """GET /fhir/patients?family=Smith — search patients by name or MRN."""
    try:
        return {"patients": await fhir.search_patients(family, given, mrn)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ── Encounters ────────────────────────────────────────────────────────────────

@app.post("/fhir/encounters", status_code=201)
async def create_encounter(body: FhirEncounterCreate):
    """POST /fhir/encounters — record a patient encounter."""
    try:
        return await fhir.create_encounter(
            body.patient_id, body.reason, body.start,
            body.end, body.status, body.encounter_class,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/fhir/patients/{patient_id}/encounters")
async def get_patient_encounters(patient_id: str):
    """GET /fhir/patients/{id}/encounters — all encounters for a patient."""
    try:
        return {"encounters": await fhir.get_encounters_for_patient(patient_id)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ── Appointments ──────────────────────────────────────────────────────────────

@app.post("/fhir/appointments", status_code=201)
async def create_appointment(body: FhirAppointmentCreate):
    """POST /fhir/appointments — schedule a patient appointment."""
    try:
        return await fhir.create_appointment(
            body.patient_id, body.description, body.start,
            body.end, body.status, body.specialty,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/fhir/patients/{patient_id}/appointments")
async def get_patient_appointments(patient_id: str):
    """GET /fhir/patients/{id}/appointments — all appointments for a patient."""
    try:
        return {"appointments": await fhir.get_appointments_for_patient(patient_id)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ── Write-back ────────────────────────────────────────────────────────────────

@app.post("/fhir/write-report")
async def write_report_to_fhir(
    body: FhirWriteReport,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    POST /fhir/write-report — persists a completed ClinicalMind report back
    to the FHIR server as a DocumentReference linked to the given patient.
    Mirrors the EMR write-back pattern.
    """
    result = await db.execute(select(Job).where(Job.id == body.job_id))
    job = result.scalar_one_or_none()
    if not job or not job.report:
        raise HTTPException(status_code=404, detail="Job not found or report not ready.")
    try:
        doc_ref = await fhir.write_clinical_report(
            body.patient_id, body.job_id, job.question, job.report
        )
        return {"message": "Report written to FHIR server.", "document_reference": doc_ref.get("id")}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ─── PDF Export ───────────────────────────────────────────────────────────────

@app.get("/report/{job_id}/pdf")
async def export_report_pdf(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    GET /report/{job_id}/pdf — download the clinical report as a formatted PDF.
    """
    from uuid import UUID
    try:
        uid = UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid job_id format.")

    result = await db.execute(select(Job).where(Job.id == uid))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.status != "complete" or not job.report:
        raise HTTPException(status_code=400, detail="Report not ready yet.")

    try:
        pdf_bytes = generate_pdf(
            question=job.question,
            report=job.report,
            summaries=job.summaries if hasattr(job, "summaries") else None,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    filename = f"ClinicalMind_Report_{job_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ClinicalMind API", "version": "2.0.0"}


# ─── SMART on FHIR ────────────────────────────────────────────────────────────

@app.get("/.well-known/smart-configuration", include_in_schema=False)
async def smart_configuration():
    """
    SMART on FHIR discovery endpoint — required for Epic App Orchard registration.
    Tells EHR systems how to launch and authorize ClinicalMind.
    """
    base_url = os.getenv("APP_BASE_URL", "http://localhost:8000")
    return {
        "issuer": base_url,
        "jwks_uri": f"{base_url}/.well-known/jwks.json",
        "authorization_endpoint": f"{base_url}/smart/authorize",
        "token_endpoint": f"{base_url}/smart/token",
        "token_endpoint_auth_methods_supported": ["client_secret_basic", "private_key_jwt"],
        "grant_types_supported": ["authorization_code"],
        "registration_endpoint": f"{base_url}/smart/register",
        "scopes_supported": [
            "openid", "fhirUser", "launch", "launch/patient",
            "patient/*.read", "user/*.read", "offline_access"
        ],
        "response_types_supported": ["code"],
        "capabilities": [
            "launch-ehr",
            "launch-standalone",
            "client-public",
            "client-confidential-symmetric",
            "context-passthrough-banner",
            "context-style",
            "context-ehr-patient",
            "permission-offline",
            "permission-patient",
            "permission-user",
        ],
        "code_challenge_methods_supported": ["S256"],
    }


@app.get("/smart/launch", include_in_schema=False)
async def smart_launch(iss: str = "", launch: str = ""):
    """
    EHR launch entry point. Redirects to frontend with FHIR context.
    In a full implementation this handles the OAuth2 PKCE flow.
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return {"message": "SMART launch initiated", "iss": iss, "launch": launch,
            "redirect": f"{frontend_url}?smart_launch=true&iss={iss}"}


@app.get("/smart/app-manifest", include_in_schema=False)
async def app_manifest():
    """SMART app manifest for Epic App Orchard submission."""
    base_url = os.getenv("APP_BASE_URL", "http://localhost:8000")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return {
        "name": "ClinicalMind",
        "description": "AI-powered clinical evidence synthesis — searches PubMed and ClinicalTrials.gov, reads FHIR patient context, and generates structured clinical reports.",
        "launch_url": f"{base_url}/smart/launch",
        "redirect_uris": [f"{frontend_url}/smart/callback"],
        "logo_uri": f"{frontend_url}/logo.png",
        "software_id": "clinicalmind",
        "software_version": "2.0.0",
        "client_name": "ClinicalMind",
        "scope": "launch/patient patient/*.read openid fhirUser",
        "token_endpoint_auth_method": "client_secret_basic",
        "grant_types": ["authorization_code"],
        "response_types": ["code"],
        "fhirVersions": ["4.0.1"],
    }


# ════════════════════════════════════════════════════════════════════════════
# PATIENT MEMORY ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════

@app.get("/patients")
async def list_patients(db: AsyncSession = Depends(get_db)):
    """List all synced patients with compact summaries for the patient selection screen."""
    return await memory.list_patients(db)


@app.get("/patients/{fhir_id}")
async def get_patient_memory(fhir_id: str, db: AsyncSession = Depends(get_db)):
    """Full patient memory — conditions, medications, labs, allergies, encounters."""
    summary = await memory.get_patient_summary(fhir_id, db)
    if not summary:
        raise HTTPException(status_code=404, detail="Patient not found. Try syncing first.")
    return summary


@app.post("/patients/{fhir_id}/sync")
async def sync_patient(fhir_id: str, db: AsyncSession = Depends(get_db)):
    """
    Pull latest FHIR data for a patient and update local memory.
    Call this after seeding patients or when FHIR data changes.
    """
    try:
        patient = await memory.sync_patient(fhir_id, db)
        return {
            "status": "synced",
            "fhir_id": fhir_id,
            "full_name": patient.full_name,
            "synced_at": patient.synced_at.isoformat(),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {e}")


@app.post("/patients/sync-all")
async def sync_all_patients(db: AsyncSession = Depends(get_db)):
    """
    Search FHIR server for all patients and sync them.
    Useful after running seed_patients.py.
    """
    fhir_patients = await fhir.search_patients()
    results = []
    for fp in fhir_patients:
        fhir_id = fp.get("id")
        if not fhir_id:
            continue
        try:
            p = await memory.sync_patient(fhir_id, db)
            results.append({"fhir_id": fhir_id, "name": p.full_name, "status": "ok"})
        except Exception as e:
            results.append({"fhir_id": fhir_id, "status": "error", "detail": str(e)})
    return {"synced": len([r for r in results if r["status"] == "ok"]), "results": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
