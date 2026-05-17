# ClinicalMind 🧬

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2-orange)](https://github.com/langchain-ai/langgraph)
[![FHIR R4](https://img.shields.io/badge/FHIR-R4-red)](https://hl7.org/fhir/R4/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**AI-powered clinical evidence synthesis** — a 6-agent LangGraph pipeline that reads patient context from a live FHIR R4 EMR, searches PubMed and ClinicalTrials.gov in parallel, detects contradictions across papers, and synthesises a structured clinical report in real time.

> Built to demonstrate production-grade healthcare integration patterns: FHIR R4 CRUD, async streaming, HIPAA-aware data handling, and multi-agent orchestration.

---

## Demo

> Ask a clinical question → watch 6 agents run live → get a full evidence report

```
"Best treatments for heart failure with reduced ejection fraction?"
```

**Pipeline runs in ~30 seconds:**

```
🏥 FHIR Context Agent   →  reads Patient + Encounter + Appointment from HAPI FHIR R4
🎯 PICO Agent           →  extracts Population · Intervention · Comparison · Outcome
🔍 Search Agent         →  parallel search: PubMed E-utilities + ClinicalTrials.gov API v2
🧬 Summarizer Agent     →  extracts structured data from each abstract via Claude
⚡ Contradiction Agent  →  detects conflicting findings across papers
📋 Synthesize Agent     →  generates clinical report with ranked interventions + recommendations
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│   Search Box · FHIR Patient Panel · Live Agent Pipeline · Report│
└──────────────────────────┬──────────────────────────────────────┘
                           │ SSE (real-time streaming)
┌──────────────────────────▼──────────────────────────────────────┐
│                     FastAPI Backend                             │
│   JWT Auth · /research · /stream/{job_id} · /fhir/* endpoints  │
└──────────┬────────────────────────────────┬────────────────────┘
           │ Celery task dispatch            │ async DB
┌──────────▼──────────┐          ┌──────────▼──────────┐
│   Redis (broker)    │          │   PostgreSQL         │
│   + SSE pub/sub     │          │   asyncpg + ORM      │
└──────────┬──────────┘          └─────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                  LangGraph 6-Agent Pipeline                     │
│                                                                 │
│  fhir ──► pico_extract ──► search ──► summarizer               │
│                                           │                     │
│                              contradiction_agent                │
│                                           │                     │
│                                      synthesize                 │
└──────────┬──────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                    External Services                            │
│  HAPI FHIR R4 (Docker) · PubMed API · ClinicalTrials.gov v2    │
│  Anthropic Claude (claude-3-5-sonnet)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features

**FHIR R4 Integration**
- Full async Python FHIR client — Patient, Encounter, Appointment CRUD
- DocumentReference write-back (clinical report stored back to EMR)
- FHIR Context Agent injects encounter history into PICO extraction
- HAPI FHIR R4 server runs in Docker — same pattern as production EMR platforms

**Multi-Agent LangGraph Pipeline**
- StateGraph with conditional routing and graceful error handling
- Parallel PubMed + ClinicalTrials.gov search in a single agent step
- Evidence grading: Level 1A (systematic review) → Level 4 (expert opinion)
- Contradiction detection flags conflicting findings across papers

**Production Infrastructure**
- FastAPI + Celery + Redis: async job queue with real-time SSE streaming
- JWT authentication with bcrypt password hashing
- PostgreSQL + async SQLAlchemy 2.0 with asyncpg
- 6-service Docker Compose: API, Worker, PostgreSQL, Redis, HAPI FHIR, Nginx

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.11, FastAPI, async SQLAlchemy 2.0 |
| **Agents** | LangGraph 0.2, LangChain, Anthropic Claude |
| **Queue** | Celery 5.4, Redis |
| **Database** | PostgreSQL 16, asyncpg |
| **FHIR** | HAPI FHIR R4 (hapifhir/hapi:latest), custom async Python client |
| **External APIs** | PubMed E-utilities, ClinicalTrials.gov API v2 |
| **Frontend** | React 18, Tailwind CSS, Framer Motion, Vite |
| **Infra** | Docker Compose, Nginx, JWT auth |

---

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Anthropic API key ([get one here](https://console.anthropic.com))

### 1. Clone and configure

```bash
git clone https://github.com/anuroopjajoba3/clinical-mind.git
cd clinical-mind
```

Create `backend/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql+asyncpg://clinicalmind:clinicalmind@db:5432/clinicalmind
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=http://localhost,http://localhost:3000
```

### 2. Start all services

```bash
docker compose up --build
```

This starts: **API** (port 8000) · **Celery worker** · **PostgreSQL** · **Redis** · **HAPI FHIR R4** (port 8080) · **Nginx + Frontend** (port 80)

### 3. Open the app

```
http://localhost
```

### Local dev (without Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Worker (separate terminal)
celery -A worker worker --loglevel=info

# Frontend (separate terminal)
cd frontend
npm install && npm run dev
```

---

## FHIR API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/fhir/health` | Check FHIR server status |
| `POST` | `/fhir/patients` | Create a Patient resource |
| `GET` | `/fhir/patients/{id}` | Read a Patient by ID |
| `GET` | `/fhir/patients?family=Smith` | Search patients by last name |
| `POST` | `/fhir/encounters` | Create an Encounter |
| `GET` | `/fhir/patients/{id}/encounters` | Get patient's encounter history |
| `POST` | `/fhir/appointments` | Create an Appointment |
| `GET` | `/fhir/patients/{id}/appointments` | Get patient's appointments |
| `POST` | `/fhir/write-report` | Write clinical report as DocumentReference |

---

## Research API

```bash
# Start a research job
curl -X POST http://localhost:8000/research \
  -H "Content-Type: application/json" \
  -d '{"question": "Best treatments for HFrEF?", "fhir_patient_id": "optional-patient-id"}'

# Stream real-time agent updates
curl http://localhost:8000/stream/{job_id}

# Get final result
curl http://localhost:8000/status/{job_id}
```

---

## Project Structure

```
clinical-mind/
├── backend/
│   ├── main.py           # FastAPI app, REST + SSE endpoints, FHIR routes
│   ├── agents.py         # LangGraph 6-agent pipeline + state machine
│   ├── fhir_client.py    # Async FHIR R4 client (Patient/Encounter/Appointment)
│   ├── worker.py         # Celery task definition
│   ├── database.py       # SQLAlchemy models + async engine
│   ├── auth.py           # JWT auth, bcrypt, token verification
│   ├── pubmed.py         # PubMed E-utilities API client
│   ├── clinicaltrials.py # ClinicalTrials.gov API v2 client
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.jsx                      # Main app with SSE + auth
│       └── components/
│           ├── AgentPipeline.jsx        # Live agent status cards
│           ├── EvidenceCard.jsx         # Per-paper evidence card
│           ├── ReportPanel.jsx          # Final clinical report
│           ├── FhirPatient.jsx          # FHIR patient search + context panel
│           ├── AnatomyBackground.jsx    # Animated SVG background
│           ├── AuthModal.jsx            # Login / register modal
│           └── SearchHistory.jsx        # Past query history
├── docker-compose.yml    # 6-service orchestration
├── nginx/nginx.conf      # Reverse proxy config
└── README.md
```

---

## Design Decisions

**Why LangGraph instead of plain LangChain?**
LangGraph gives explicit state management and conditional routing — the FHIR agent can skip cleanly when no patient is attached, and any agent can short-circuit the pipeline on error without breaking downstream nodes.

**Why Celery + Redis instead of FastAPI background tasks?**
Background tasks in FastAPI share the same process as the HTTP server. Long-running LLM calls (30+ seconds) would block uvicorn workers. Celery offloads these to a separate process pool, keeping the API responsive and allowing horizontal worker scaling.

**Why HAPI FHIR R4?**
It's the same open-source FHIR server used by many production health systems (including as a reference implementation). Running it in Docker means the FHIR read/write-back patterns demonstrated here are directly transferable to real EMR integrations.

---

## Author

**Anuroop Jajoba** — [LinkedIn](https://linkedin.com/in/anuroop-jajoba) · [Portfolio](https://anuroopjajoba.com) · [GitHub](https://github.com/anuroopjajoba3)

MS Information Technology, University of New Hampshire · AWS Cloud Practitioner
