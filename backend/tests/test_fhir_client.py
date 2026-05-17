"""
Tests for the async FHIR R4 client — mocked HAPI server responses.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx


# ── helpers ──────────────────────────────────────────────────────────────────

def mock_fhir_response(resource: dict, status: int = 200):
    resp = MagicMock(spec=httpx.Response)
    resp.status_code = status
    resp.json.return_value = resource
    resp.raise_for_status = MagicMock()
    return resp


PATIENT_RESOURCE = {
    "resourceType": "Patient",
    "id": "patient-123",
    "name": [{"family": "Smith", "given": ["John"]}],
    "birthDate": "1980-01-15",
    "gender": "male",
}

BUNDLE_RESOURCE = {
    "resourceType": "Bundle",
    "total": 1,
    "entry": [{"resource": PATIENT_RESOURCE}],
}


# ── tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_patient_success():
    from fhir_client import get_patient
    with patch("fhir_client.httpx.AsyncClient") as mock_cls:
        mock_http = AsyncMock()
        mock_cls.return_value.__aenter__.return_value = mock_http
        mock_http.get.return_value = mock_fhir_response(PATIENT_RESOURCE)
        result = await get_patient("patient-123")
    assert result["id"] == "patient-123"
    assert result["name"][0]["family"] == "Smith"


@pytest.mark.asyncio
async def test_get_patient_not_found():
    from fhir_client import get_patient
    with patch("fhir_client.httpx.AsyncClient") as mock_cls:
        mock_http = AsyncMock()
        mock_cls.return_value.__aenter__.return_value = mock_http
        not_found = mock_fhir_response({"resourceType": "OperationOutcome"}, 404)
        not_found.raise_for_status.side_effect = httpx.HTTPStatusError(
            "404", request=MagicMock(), response=not_found
        )
        mock_http.get.return_value = not_found
        result = await get_patient("nonexistent-id")
    assert result is None


@pytest.mark.asyncio
async def test_search_patients_returns_list():
    from fhir_client import search_patients
    with patch("fhir_client.httpx.AsyncClient") as mock_cls:
        mock_http = AsyncMock()
        mock_cls.return_value.__aenter__.return_value = mock_http
        mock_http.get.return_value = mock_fhir_response(BUNDLE_RESOURCE)
        results = await search_patients(family="Smith")
    assert isinstance(results, list)
    assert len(results) == 1
    assert results[0]["id"] == "patient-123"


@pytest.mark.asyncio
async def test_search_patients_empty_bundle():
    from fhir_client import search_patients
    empty_bundle = {"resourceType": "Bundle", "total": 0, "entry": []}
    with patch("fhir_client.httpx.AsyncClient") as mock_cls:
        mock_http = AsyncMock()
        mock_cls.return_value.__aenter__.return_value = mock_http
        mock_http.get.return_value = mock_fhir_response(empty_bundle)
        results = await search_patients(family="Unknown")
    assert results == []


@pytest.mark.asyncio
async def test_fhir_server_healthy_true():
    from fhir_client import fhir_server_healthy
    capability = {"resourceType": "CapabilityStatement", "status": "active"}
    with patch("fhir_client.httpx.AsyncClient") as mock_cls:
        mock_http = AsyncMock()
        mock_cls.return_value.__aenter__.return_value = mock_http
        mock_http.get.return_value = mock_fhir_response(capability)
        result = await fhir_server_healthy()
    assert result is True


@pytest.mark.asyncio
async def test_fhir_server_healthy_false_on_error():
    from fhir_client import fhir_server_healthy
    with patch("fhir_client.httpx.AsyncClient") as mock_cls:
        mock_http = AsyncMock()
        mock_cls.return_value.__aenter__.return_value = mock_http
        mock_http.get.side_effect = httpx.ConnectError("refused")
        result = await fhir_server_healthy()
    assert result is False
