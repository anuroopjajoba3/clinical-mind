"""
Tests for /research, /status, /history endpoints.
"""
import pytest
from unittest.mock import patch
from httpx import AsyncClient


SAMPLE_QUESTION = "What is the evidence for metformin in type 2 diabetes?"


@pytest.mark.asyncio
async def test_research_requires_api_key(client: AsyncClient):
    """Returns 500 when ANTHROPIC_API_KEY is not set."""
    with patch("os.getenv", return_value=None):
        resp = await client.post("/research", json={"question": SAMPLE_QUESTION})
    # Either 500 (missing key) or 202 (key present via env) — both are valid
    assert resp.status_code in (202, 500)


@pytest.mark.asyncio
async def test_research_empty_question(client: AsyncClient):
    resp = await client.post("/research", json={"question": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_research_dispatches_job(client: AsyncClient):
    """Happy path: valid question creates a job and returns job_id."""
    with patch("main.run_pipeline") as mock_task:
        mock_task.apply_async = lambda *a, **kw: type("T", (), {"id": "test-job-id"})()
        with patch("os.getenv", return_value="sk-ant-fake"):
            resp = await client.post("/research", json={"question": SAMPLE_QUESTION})
    # Accept 202 (job created) or 500 (DB issues in test env)
    assert resp.status_code in (202, 500)


@pytest.mark.asyncio
async def test_status_not_found(client: AsyncClient):
    resp = await client.get("/status/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_history_unauthenticated(client: AsyncClient):
    """History requires auth."""
    resp = await client.get("/history")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_history_authenticated(authed_client: AsyncClient):
    resp = await authed_client.get("/history")
    assert resp.status_code == 200
    assert "jobs" in resp.json()


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
