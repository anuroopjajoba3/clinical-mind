"""
Async SQLAlchemy database layer.
Models: User, Job, Patient, PatientEntity
"""

import os
import uuid
from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import (
    Column, String, Boolean, DateTime, Float, Text, JSON, ForeignKey
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


# ─── Discharge Monitoring ─────────────────────────────────────────────────────

class CareCoordinator(Base):
    """
    Licensed care coordinators assigned to post-discharge patients.
    Coordinators are human — this table tracks their profile and caseload.
    """
    __tablename__ = "care_coordinators"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name    = Column(String(255), nullable=False)
    email        = Column(String(255), unique=True, nullable=False)
    license_type = Column(String(100), nullable=True)   # RN, NP, PA, CHW, etc.
    license_id   = Column(String(100), nullable=True)
    phone        = Column(String(30), nullable=True)
    active       = Column(Boolean, default=True, nullable=False)
    created_at   = Column(DateTime, default=datetime.utcnow)

    enrollments = relationship(
        "DischargeEnrollment", back_populates="coordinator",
        foreign_keys="DischargeEnrollment.coordinator_id",
    )


class DischargeEnrollment(Base):
    """
    One row per patient discharge episode.
    Created when a patient is discharged and enrolled in the 30-day monitoring program.
    status: active | completed | readmitted | withdrawn
    risk_tier: high | medium | low  (updated daily by the risk agent)
    """
    __tablename__ = "discharge_enrollments"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id          = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    coordinator_id      = Column(UUID(as_uuid=True), ForeignKey("care_coordinators.id"), nullable=True)

    discharge_date      = Column(DateTime, nullable=False)
    primary_diagnosis   = Column(String(512), nullable=True)
    discharge_summary   = Column(Text, nullable=True)

    # Risk tier refreshed each time the risk agent runs
    risk_tier           = Column(String(10), default="medium", nullable=False)  # high|medium|low
    risk_score          = Column(Float, nullable=True)                          # 0.0–1.0

    # Key follow-up instructions extracted from discharge notes
    follow_up_actions   = Column(JSON, nullable=True)  # [{action, due_date, completed}]

    # Medications at discharge — checked against subsequent labs/conditions
    discharge_meds      = Column(JSON, nullable=True)  # [{name, dose, frequency}]

    status              = Column(String(20), default="active", nullable=False, index=True)
    readmission_date    = Column(DateTime, nullable=True)

    enrolled_at         = Column(DateTime, default=datetime.utcnow)
    updated_at          = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient     = relationship("Patient", backref="discharge_enrollments")
    coordinator = relationship("CareCoordinator", back_populates="enrollments",
                               foreign_keys=[coordinator_id])
    risk_scores = relationship("DailyRiskScore", back_populates="enrollment",
                               cascade="all, delete-orphan",
                               order_by="DailyRiskScore.scored_at.desc()")
    checkins    = relationship("CoordinatorCheckin", back_populates="enrollment",
                               cascade="all, delete-orphan",
                               order_by="CoordinatorCheckin.checked_in_at.desc()")


class DailyRiskScore(Base):
    """
    Daily risk assessment produced by the discharge_risk_agent for each active enrollment.
    Keeps a time-series so the hospital dashboard can show trend sparklines.
    """
    __tablename__ = "daily_risk_scores"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey("discharge_enrollments.id"),
                           nullable=False, index=True)

    risk_score    = Column(Float, nullable=False)          # 0.0–1.0
    risk_tier     = Column(String(10), nullable=False)     # high|medium|low
    risk_flags    = Column(JSON, nullable=True)            # [{flag, severity, detail}]
    recommended_actions = Column(JSON, nullable=True)      # [{action, urgency}]
    agent_reasoning     = Column(Text, nullable=True)      # LLM rationale (for audit)

    scored_at     = Column(DateTime, default=datetime.utcnow, index=True)

    enrollment = relationship("DischargeEnrollment", back_populates="risk_scores")


class CoordinatorCheckin(Base):
    """
    Logged check-in event when a coordinator contacts a discharged patient.
    method: phone | in_person | video | message
    outcome: well | concerning | urgent | no_answer
    """
    __tablename__ = "coordinator_checkins"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey("discharge_enrollments.id"),
                           nullable=False, index=True)
    coordinator_id = Column(UUID(as_uuid=True), ForeignKey("care_coordinators.id"), nullable=True)

    method        = Column(String(20), nullable=False, default="phone")  # phone|in_person|video|message
    outcome       = Column(String(20), nullable=False, default="well")   # well|concerning|urgent|no_answer
    notes         = Column(Text, nullable=True)
    vitals_reported = Column(JSON, nullable=True)   # {bp, hr, weight, temp, o2sat} — patient self-report
    escalated     = Column(Boolean, default=False)  # True if coordinator flagged for clinical review

    checked_in_at = Column(DateTime, default=datetime.utcnow, index=True)

    enrollment  = relationship("DischargeEnrollment", back_populates="checkins")
    coordinator = relationship("CareCoordinator", foreign_keys=[coordinator_id])


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
