# ClinicalMind 🧬

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2-orange)](https://github.com/langchain-ai/langgraph)
[![FHIR R4](https://img.shields.io/badge/FHIR-R4-red)](https://hl7.org/fhir/R4/)
[![SMART on FHIR](https://img.shields.io/badge/SMART_on_FHIR-Epic_compatible-critical)](https://docs.smarthealthit.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**Real-time LLM-powered platform for clinical workflows** — an 8-agent LangGraph pipeline (Claude API primary, OpenAI API fallback) that reads patient context from a live FHIR R4 EMR, searches 35M+ PubMed records and ClinicalTrials.gov in parallel, detects contradictions and drug interactions, and streams a structured, evidence-graded clinical report. **Compresses clinical research from days to about 60 seconds.**

> Built to demonstrate production-grade healthcare integration patterns: FHIR R4 CRUD, SMART on FHIR Epic compatibility, async SSE streaming, JWT auth, Prometheus observability, rate limiting, and multi-agent orchestration over sensitive clinical data.

---

## Demo

> Ask a clinical question → watch 8 agents run live → get a full evidence report

```
"Best treatments for heart failure with reduced ejection fraction?"
```

**Pipeline completes in about 60 seconds:**

```
🏥 FHIR Context Agent    →  loads patient memory: conditions, meds, labs, allergies (FHIR R4)
🎯 PICO Agent            →  extracts Population · Intervention · Comparison · Outcome + MeSH query
🔍 Search Agent          →  parallel search: PubMed E-utilities (35M+ records) + ClinicalTrials.gov v2
🧬 Summarizer Agent      →  extracts structured data + Oxford CEBM evidence level per source
⚡ Contradiction Agent   →  flags conflicting findings across papers
💊 Drug Interaction Agent→  checks recommendations against the patient's current medications
📋 Synthesize Agent      →  ranked recommendations with confidence scores + inline citations
🔭 Follow-up Agent       →  proposes the next clinical questions from evidence gaps
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 React 18 + TypeScript Frontend                  │
│  Patient Rail · Evidence Search · Compare A/B · Discharge Board │
└──────────────────────────┬──────────────────────────────────────┘
                           │ SSE (real-time streaming)
┌──────────────────────────▼──────────────────────────────────────┐
│                     FastAPI Backend                             │
│  JWT Auth · SlowAPI rate limiting · Prometheus /metrics         │
│  /research · /compare · /stream/{job} · /fhir/* · /discharge/*  │
└──────────┬────────────────────────────────┬────────────────────┘
           │ Celery task dispatch            │ async DB
┌──────────▼──────────┐          ┌──────────▼──────────┐
│   Redis (broker)    │          │   PostgreSQL         │
│   + SSE state cache │          │   asyncpg + ORM      │
└──────────┬──────────┘          └─────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                  LangGraph 8-Agent Pipeline                     │
│                                                                 │
│  fhir ─► pico ─► search ─► summarizer ─► contradiction          │
│                                              │                  │
│                            drug_interaction ─┴─► synthesize     │
│                                                       │         │
│                                                   followup      │
└──────────┬──────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                    External Services                            │
│  HAPI FHIR R4 (Docker) · PubMed API · ClinicalTrials.gov v2     │
│  Anthropic Claude (primary) · OpenAI (automatic fallback)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features

**FHIR R4 EHR Integration**
- Full async Python FHIR client — Patient, Encounter, Appointment, Condition, MedicationRequest, Observation, AllergyIntolerance
- DocumentReference write-back: every completed report is stored back to the EMR chart
- Patient Memory layer: FHIR resources synced into PostgreSQL with lab-trend and risk analysis
- SMART on FHIR discovery endpoints (`/.well-known/smart-configuration`, app manifest) for Epic compatibility

**Multi-Agent LangGraph Pipeline**
- 8-agent StateGraph with conditional routing and graceful per-agent error handling
- Claude API primary with automatic OpenAI API fallback on errors or rate limits
- Parallel PubMed + ClinicalTrials.gov search in a single agent step
- Evidence grading: Level 1A (systematic review) → Level 4 (expert opinion), with per-recommendation confidence scores
- Contradiction detection + rule-based and LLM drug-interaction checks against the live med list
- Session memory: follow-up questions build on prior answers in the same session

**Clinical Workflows**
- Head-to-head treatment comparison (two pipelines + synthesis verdict)
- 30-day post-discharge monitoring: AI risk scoring, coordinator check-ins, hospital dashboard
- PDF export of clinical reports; CDS Hooks demo integration

**Production Infrastructure**
- FastAPI + Celery + Redis: async job queue with real-time SSE streaming
- JWT authentication with bcrypt password hashing; SlowAPI rate limiting on LLM endpoints
- Prometheus metrics (`/metrics`) with custom pipeline counters and health checks
- PostgreSQL + async SQLAlchemy 2.0 with asyncpg
- Docker Compose orchestration; deployable to AWS and Azure

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.11, FastAPI, async SQLAlchemy 2.0 |
| **Agents** | LangGraph 0.2, LangChain, Claude API (primary), OpenAI API (fallback) |
| **Queue** | Celery 5.4, Redis |
| **Database** | PostgreSQL 16, asyncpg |
| **FHIR** | HAPI FHIR R4, SMART on FHIR, custom async Python client |
| **External APIs** | PubMed E-utilities (35M+ records), ClinicalTrials.gov API v2 |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion, Vite |
| **Observability** | Prometheus, structured health checks, SlowAPI rate limiting |
| **Infra** | Docker Compose, Nginx, JWT auth, AWS / Azure |

---

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Anthropic API key ([get one here](https://console.anthropic.com))
- Optional: OpenAI API key for automatic model fallback

### 1. Clone and configure

```bash
git clone https://github.com/anuroopjajoba3/clinical-mind.git
cd clinical-mind
```

Create `backend/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...            # optional — enables automatic fallback
DATABASE_URL=postgresql+asyncpg://clinicalmind:clinicalmind@db:5432/clinicalmind
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=http://localhost,http://localhost:3000
```

### 2. Start all services

```bash
docker compose up --build
```

This starts: **API** · **Celery worker** · **PostgreSQL** · **Redis** · **HAPI FHIR R4** · **Nginx + Frontend**

### 3. Open the app

```
http://localhost
```

### Local dev (without Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Worker (separate terminal)
celery -A worker worker --loglevel=info

# Frontend (separate terminal)
cd frontend
npm install && npm run dev        # npm run typecheck for TypeScript checks
```

---

## API Overview

### Research & comparison

```bash
# Start a research job (10/min rate limited)
curl -X POST http://localhost:8001/research \
  -H "Content-Type: application/json" \
  -d '{"question": "Best treatments for HFrEF?", "fhir_patient_id": "optional-patient-id"}'

# Stream real-time agent updates (SSE)
curl http://localhost:8001/stream/{job_id}

# Poll final result / export PDF
curl http://localhost:8001/status/{job_id}
curl http://localhost:8001/report/{job_id}/pdf -o report.pdf

# Compare two treatments head-to-head
curl -X POST http://localhost:8001/compare \
  -d '{"question_a": "...", "question_b": "..."}'
```

### FHIR endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/fhir/health` | Check FHIR server status |
| `POST` | `/fhir/patients` | Create a Patient resource |
| `GET` | `/fhir/patients/{id}` | Read a Patient by ID |
| `GET` | `/fhir/patients?family=Smith` | Search patients by name or MRN |
| `POST` | `/fhir/encounters` | Create an Encounter |
| `GET` | `/fhir/patients/{id}/encounters` | Encounter history |
| `POST` | `/fhir/appointments` | Create an Appointment |
| `GET` | `/fhir/patients/{id}/documents` | Reports written back to the chart |
| `POST` | `/fhir/write-report` | Write clinical report as DocumentReference |

### Patient memory & discharge monitoring

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/patients` | Synced patients with risk assessment |
| `GET` | `/patients/{fhir_id}` | Full patient memory: conditions, meds, labs, trends |
| `POST` | `/patients/{fhir_id}/sync` | Pull latest FHIR data into local memory |
| `GET` | `/patients/{fhir_id}/insights` | Longitudinal evidence-query timeline |
| `POST` | `/discharge/enroll` | Enroll patient in 30-day monitoring + first AI risk score |
| `GET` | `/discharge/dashboard` | Hospital dashboard: risk tiers + check-ins |
| `POST` | `/discharge/{id}/checkin` | Log a coordinator check-in |

---

## Project Structure

```
clinical-mind/
├── backend/
│   ├── main.py            # FastAPI app: REST + SSE, FHIR, discharge, SMART endpoints
│   ├── agents.py          # LangGraph 8-agent pipeline + discharge risk agent
│   ├── fhir_client.py     # Async FHIR R4 client (7 resource types + write-back)
│   ├── patient_memory.py  # FHIR → PostgreSQL sync, lab trends, risk engine
│   ├── workspace.py       # Longitudinal patient insight memory
│   ├── cds_hooks.py       # CDS Hooks integration endpoints
│   ├── worker.py          # Celery task: pipeline execution + persistence
│   ├── database.py        # SQLAlchemy models + async engine
│   ├── auth.py            # JWT auth, bcrypt, token verification
│   ├── pubmed.py          # PubMed E-utilities client
│   ├── clinicaltrials.py  # ClinicalTrials.gov API v2 client
│   ├── pdf_export.py      # WeasyPrint report → PDF
│   ├── eval/              # Agent evaluation harness + scenarios
│   └── tests/             # pytest suite (auth, agents, FHIR, memory, workspace)
├── frontend/
│   ├── tsconfig.json      # TypeScript config (npm run typecheck)
│   └── src/
│       ├── main.tsx                     # Entry: landing page vs /app routing
│       ├── App.tsx                      # Main app: SSE, auth, compare, session memory
│       ├── api.ts                       # Typed API client + SSE stream helper
│       ├── components/
│       │   ├── AgentPipeline.jsx        # Live 8-agent status cards
│       │   ├── EvidenceCard.jsx         # Per-paper evidence card
│       │   ├── ReportPanel.jsx          # Report: recommendations, citations, follow-ups
│       │   ├── ComparisonPanel.jsx      # A/B treatment comparison verdict
│       │   ├── PatientRail.jsx          # Patient list with risk badges
│       │   ├── PatientDashboard.jsx     # Conditions, meds, labs, query history
│       │   ├── DischargeDashboard.jsx   # 30-day monitoring dashboard
│       │   └── SearchHistory.jsx        # Past query drawer
│       └── landing/                     # Marketing landing page
├── docker-compose.yml     # Multi-service orchestration
└── README.md
```

---

## Design Decisions

**Why LangGraph instead of plain LangChain?**
LangGraph gives explicit state management and conditional routing — the FHIR agent can skip cleanly when no patient is attached, and any agent can short-circuit the pipeline on error without breaking downstream nodes.

**Why Claude primary with OpenAI fallback?**
Clinical workflows can't fail because one provider is rate-limited. `get_llm()` wires Claude as the primary model and attaches OpenAI via LangChain's `with_fallbacks`, so any Claude API error transparently retries on OpenAI without pipeline changes.

**Why Celery + Redis instead of FastAPI background tasks?**
Background tasks in FastAPI share the same process as the HTTP server. Long-running LLM calls would block uvicorn workers. Celery offloads these to a separate process pool, keeping the API responsive and allowing horizontal worker scaling.

**Why HAPI FHIR R4?**
It's the same open-source FHIR server used by many production health systems (including as a reference implementation). Running it in Docker means the FHIR read/write-back patterns demonstrated here are directly transferable to real EMR integrations — and the SMART on FHIR discovery endpoints make the app Epic-launchable.

---

## Author

**Anuroop Jajoba** — [LinkedIn](https://linkedin.com/in/anuroop-jajoba) · [Portfolio](https://anuroopjajoba.com) · [GitHub](https://github.com/anuroopjajoba3)

MS Information Technology, University of New Hampshire · AWS Cloud Practitioner

> For research use only · Not a substitute for clinical judgment
