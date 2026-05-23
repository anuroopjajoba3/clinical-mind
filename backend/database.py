"""
Async SQLAlchemy database layer.
Models: User, Job, Patient, PatientEntity
"""

import os
import uuid
from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import (
    Column, String, Boolean, DateTime, Text, JSON, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://clinicalmind:clinicalmind@localhost:5432/clinicalmind"
)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name       = Column(String(255), nullable=True)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

    jobs = relationship("Job", back_populates="user", cascade="all, delete-orphan")


class Job(Base):
    __tablename__ = "jobs"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    fhir_patient_id = Column(String(255), nullable=True, index=True)
    question       = Column(Text, nullable=False)
    status         = Column(String(20), default="pending")
    agent_status   = Column(JSON, default=lambda: {
        "pico": "idle", "search": "idle",
        "summarizer": "idle", "contradiction": "idle", "synthesize": "idle"
    })
    pico           = Column(JSON, nullable=True)
    summaries      = Column(JSON, nullable=True)
    contradictions = Column(JSON, nullable=True)
    report         = Column(JSON, nullable=True)
    error          = Column(Text, nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)
    completed_at   = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="jobs")


class Patient(Base):
    """
    Local cache of FHIR Patient resources.
    Synced from the FHIR server; acts as the anchor for PatientEntity records.
    """
    __tablename__ = "patients"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fhir_id     = Column(String(255), unique=True, nullable=False, index=True)
    full_name   = Column(String(255), nullable=True)
    birth_date  = Column(String(20), nullable=True)
    gender      = Column(String(20), nullable=True)
    mrn         = Column(String(100), nullable=True)
    synced_at   = Column(DateTime, default=datetime.utcnow)

    entities = relationship(
        "PatientEntity", back_populates="patient",
        cascade="all, delete-orphan",
        order_by="PatientEntity.onset_date",
    )
    insights = relationship(
        "PatientInsight", back_populates="patient",
        cascade="all, delete-orphan",
        order_by="PatientInsight.created_at.desc()",
    )


class PatientEntity(Base):
    """
    Structured clinical entities extracted from FHIR resources.
    entity_type: condition | medication | lab | allergy | procedure | encounter
    """
    __tablename__ = "patient_entities"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id  = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    fhir_id     = Column(String(255), nullable=True)   # original FHIR resource id
    entity_type = Column(String(30), nullable=False)   # condition|medication|lab|allergy|procedure|encounter
    code        = Column(String(100), nullable=True)   # SNOMED / LOINC / RxNorm code
    display     = Column(String(512), nullable=False)  # human-readable name
    status      = Column(String(50), nullable=True)    # active|resolved|completed|stopped
    onset_date  = Column(String(30), nullable=True)    # ISO date string
    value       = Column(String(255), nullable=True)   # lab value + unit, e.g. "7.2 mmol/L"
    extra       = Column(JSON, nullable=True)          # any additional FHIR fields
    created_at  = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="entities")


class PatientInsight(Base):
    """
    Persistent evidence memory — one row per completed synthesis for a patient.
    Accumulates across sessions to form a longitudinal clinical intelligence record.

    Each row captures:
      - the clinical question that was asked
      - the synthesised recommendations (structured JSON)
      - which PubMed / ClinicalTrials papers supported those recommendations
      - a summary of evidence level distribution (how many 1A, 1B, 2A … sources)
      - drug interactions flagged in this query
      - a link back to the originating Job row for full detail retrieval
    """
    __tablename__ = "patient_insights"

    id                   = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id           = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    job_id               = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=True)

    question             = Column(Text, nullable=False)
    clinical_bottom_line = Column(Text, nullable=True)

    # Full recommendations list: [{recommendation, rationale, evidence_level, source_refs}]
    recommendations      = Column(JSON, nullable=True)

    # Evidence level tally: {"1A": 2, "1B": 1, "2A": 3, ...}
    evidence_levels      = Column(JSON, nullable=True)

    # PMIDs / trial IDs that were synthesised
    source_pmids         = Column(JSON, nullable=True)

    # Drug interactions flagged: [{drug_a, drug_b, severity, description}]
    drug_interactions    = Column(JSON, nullable=True)

    # Contradiction flags from this query
    contradictions       = Column(JSON, nullable=True)

    created_at           = Column(DateTime, default=datetime.utcnow, index=True)

    patient = relationship("Patient", back_populates="insights")


# ─── Engine + Session ─────────────────────────────────────────────────────────

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def create_tables():
    """Create all tables (call on startup)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
