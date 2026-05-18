"""
Celery worker — runs the LangGraph pipeline as a background task.
Publishes real-time status updates to Redis pub/sub channel job:{job_id}.
"""

import os
import sys
import json
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Ensure the backend directory is on the path for forked worker processes
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load .env so API keys are available in forked worker processes
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

import redis as sync_redis  # noqa: E402
from celery import Celery  # noqa: E402

REDIS_URL   = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app  = Celery("clinicalmind", broker=REDIS_URL, backend=REDIS_URL)

_ssl_opts = {"ssl_cert_reqs": "none"} if REDIS_URL.startswith("rediss://") else {}
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    broker_use_ssl=_ssl_opts or None,
    redis_backend_use_ssl=_ssl_opts or None,
)


def publish(r: sync_redis.Redis, job_id: str, data: dict):
    """Publish a status update to the Redis pub/sub channel for this job."""
    r.publish(f"job:{job_id}", json.dumps(data))
    # Also store latest state so /status endpoint can serve it without subscribing
    r.set(f"job:{job_id}:latest", json.dumps(data), ex=3600)


@celery_app.task(bind=True, name="run_pipeline", max_retries=2)
def run_pipeline(self, job_id: str, question: str, fhir_patient_id: str = None):
    """
    Run the full 5-agent LangGraph pipeline.
    Updates are published to Redis so the SSE endpoint can stream them.
    Also persists final result to PostgreSQL.
    """
    from agents import clinical_graph, ClinicalState
    from database import AsyncSessionLocal, Job
    from sqlalchemy import select

    _ssl = {"ssl_cert_reqs": "none"} if REDIS_URL.startswith("rediss://") else {}
    r = sync_redis.from_url(REDIS_URL, decode_responses=True, **_ssl)

    initial_state: ClinicalState = {
        "question": question,
        "job_id": job_id,
        "fhir_patient_id": fhir_patient_id,
        "fhir_context": None,
        "pico": None,
        "raw_papers": [],
        "summaries": [],
        "contradictions": [],
        "report": {},
        "agent_status": {
            "fhir": "idle", "pico": "idle", "search": "idle",
            "summarizer": "idle", "contradiction": "idle", "synthesize": "idle",
        },
        "error": None,
    }

    publish(r, job_id, {"status": "running", "agent_status": initial_state["agent_status"]})

    async def _run():
        final_state = initial_state.copy()
        try:
            async for event in clinical_graph.astream(initial_state):
                for node_name, node_output in event.items():
                    if isinstance(node_output, dict):
                        final_state.update({k: v for k, v in node_output.items() if v is not None})
                        update = {
                            "status": "running",
                            "agent_status": final_state.get("agent_status", {}),
                            "pico": final_state.get("pico"),
                            "summaries": final_state.get("summaries"),
                            "contradictions": final_state.get("contradictions"),
                            "report": final_state.get("report"),
                            "error": final_state.get("error"),
                        }
                        publish(r, job_id, update)
        except Exception as e:
            final_state["error"] = str(e)

        job_status = "error" if final_state.get("error") else "complete"
        final_update = {
            "status": job_status,
            "agent_status": final_state.get("agent_status", {}),
            "pico": final_state.get("pico"),
            "summaries": final_state.get("summaries"),
            "contradictions": final_state.get("contradictions"),
            "report": final_state.get("report"),
            "error": final_state.get("error"),
            "completed_at": datetime.utcnow().isoformat(),
        }
        publish(r, job_id, final_update)

        # Persist to PostgreSQL
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Job).where(Job.id == job_id))
                job = result.scalar_one_or_none()
                if job:
                    job.status        = job_status
                    job.agent_status  = final_state.get("agent_status")
                    job.pico          = final_state.get("pico")
                    job.summaries     = final_state.get("summaries")
                    job.contradictions = final_state.get("contradictions")
                    job.report        = final_state.get("report")
                    job.error         = final_state.get("error")
                    job.completed_at  = datetime.utcnow()
                    await db.commit()
        except Exception as e:
            print(f"DB persist error: {e}")

        return final_update

    return asyncio.run(_run())
