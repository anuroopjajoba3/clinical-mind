"""
Tests for workspace.py — patient evidence memory layer.

DB-dependent tests use AsyncMock so no real database is required.
Pure helper tests (_serialize, _top_level) run inline.
"""
import uuid
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

from workspace import _serialize, _top_level, save_insight, get_patient_insights, get_insight_by_id


# ─── _top_level ───────────────────────────────────────────────────────────────

def test_top_level_returns_1a_when_present():
    assert _top_level({"1A": 2, "2B": 1, "3": 3}) == "1A"


def test_top_level_skips_missing_levels():
    assert _top_level({"2A": 1, "3": 2}) == "2A"


def test_top_level_falls_back_to_4_when_empty():
    assert _top_level({}) == "4"


def test_top_level_zero_count_not_counted():
    assert _top_level({"1A": 0, "1B": 0, "3": 1}) == "3"


# ─── _serialize ───────────────────────────────────────────────────────────────

def _make_insight(**overrides):
    m = MagicMock()
    m.id = uuid.uuid4()
    m.patient_id = uuid.uuid4()
    m.job_id = uuid.uuid4()
    m.question = "What is first-line therapy for T2DM?"
    m.clinical_bottom_line = "Metformin remains first-line."
    m.recommendations = [{"text": "Start metformin"}, {"text": "Lifestyle modification"}]
    m.evidence_levels = {"1A": 3, "2B": 1}
    m.source_pmids = ["12345678", "87654321", "11223344"]
    m.drug_interactions = []
    m.contradictions = []
    m.created_at = datetime(2026, 1, 15, 10, 0, 0)
    for k, v in overrides.items():
        setattr(m, k, v)
    return m


def test_serialize_basic_shape():
    insight = _make_insight()
    result = _serialize(insight)

    assert result["question"] == "What is first-line therapy for T2DM?"
    assert result["clinical_bottom_line"] == "Metformin remains first-line."
    assert result["rec_count"] == 2
    assert result["source_count"] == 3
    assert result["top_evidence"] == "1A"


def test_serialize_created_at_is_iso_string():
    insight = _make_insight()
    result = _serialize(insight)
    assert result["created_at"] == "2026-01-15T10:00:00"


def test_serialize_no_job_id():
    insight = _make_insight(job_id=None)
    result = _serialize(insight)
    assert result["job_id"] is None


def test_serialize_empty_collections():
    insight = _make_insight(
        recommendations=[],
        source_pmids=[],
        evidence_levels={},
        drug_interactions=[],
        contradictions=[],
    )
    result = _serialize(insight)
    assert result["rec_count"] == 0
    assert result["source_count"] == 0
    assert result["top_evidence"] == "4"


def test_serialize_none_created_at():
    insight = _make_insight(created_at=None)
    result = _serialize(insight)
    assert result["created_at"] is None


# ─── save_insight (DB mocked) ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_save_insight_returns_none_when_patient_not_found():
    db = AsyncMock()
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=result_mock)

    result = await save_insight(
        db,
        fhir_patient_id="Patient/unknown",
        job_id=str(uuid.uuid4()),
        question="Test question",
        report={"clinical_bottom_line": "Test", "recommendations": []},
        summaries=[],
        contradictions=[],
    )
    assert result is None


@pytest.mark.asyncio
async def test_save_insight_computes_evidence_levels_from_summaries():
    patient_mock = MagicMock()
    patient_mock.id = uuid.uuid4()

    db = AsyncMock()
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = patient_mock
    db.execute = AsyncMock(return_value=result_mock)
    db.add = MagicMock()
    db.commit = AsyncMock()

    refreshed = MagicMock()
    db.refresh = AsyncMock(return_value=refreshed)

    summaries = [
        {"pmid": "111", "evidence_level": "1A"},
        {"pmid": "222", "evidence_level": "1A"},
        {"pmid": "333", "evidence_level": "2B"},
    ]

    await save_insight(
        db,
        fhir_patient_id="Patient/123",
        job_id=str(uuid.uuid4()),
        question="Test",
        report={"clinical_bottom_line": "Ok", "recommendations": []},
        summaries=summaries,
        contradictions=[],
    )

    db.add.assert_called_once()
    added = db.add.call_args[0][0]
    assert added.evidence_levels == {"1A": 2, "2B": 1}
    assert set(added.source_pmids) == {"111", "222", "333"}


# ─── get_patient_insights (DB mocked) ─────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_patient_insights_returns_empty_when_patient_not_found():
    db = AsyncMock()
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=result_mock)

    result = await get_patient_insights(db, "Patient/ghost")
    assert result == []


# ─── get_insight_by_id (DB mocked) ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_insight_by_id_returns_none_when_not_found():
    db = AsyncMock()
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=result_mock)

    result = await get_insight_by_id(db, str(uuid.uuid4()))
    assert result is None


@pytest.mark.asyncio
async def test_get_insight_by_id_serializes_found_row():
    db = AsyncMock()
    insight = _make_insight()
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = insight
    db.execute = AsyncMock(return_value=result_mock)

    result = await get_insight_by_id(db, str(uuid.uuid4()))
    assert result is not None
    assert result["rec_count"] == 2
    assert result["top_evidence"] == "1A"
