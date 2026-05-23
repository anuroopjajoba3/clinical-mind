"""
Tests for patient_memory.py — pure helper functions and FHIR entity converters.

Covers _coding_display, _coding_code, _patient_name, _patient_mrn,
_parse_numeric, _condition_to_entity, _medication_to_entity,
_observation_to_entity, _allergy_to_entity, _encounter_to_entity,
and _compute_risk.

No database or FHIR server needed — all tests are pure/unit level.
"""
import uuid
from unittest.mock import MagicMock

from patient_memory import (
    _coding_display,
    _coding_code,
    _patient_name,
    _patient_mrn,
    _parse_numeric,
    _condition_to_entity,
    _medication_to_entity,
    _observation_to_entity,
    _allergy_to_entity,
    _encounter_to_entity,
    _compute_risk,
)


# ─── _coding_display ──────────────────────────────────────────────────────────

def test_coding_display_returns_first_display():
    codings = [{"code": "73211009", "display": "Diabetes mellitus type 2"}]
    assert _coding_display(codings) == "Diabetes mellitus type 2"


def test_coding_display_skips_entries_without_display():
    codings = [{"code": "123"}, {"code": "456", "display": "Hypertension"}]
    assert _coding_display(codings) == "Hypertension"


def test_coding_display_empty_list():
    assert _coding_display([]) == ""


# ─── _coding_code ─────────────────────────────────────────────────────────────

def test_coding_code_returns_first_code():
    codings = [{"code": "73211009", "system": "http://snomed.info/sct"}]
    assert _coding_code(codings) == "73211009"


def test_coding_code_skips_entries_without_code():
    codings = [{"display": "only display"}, {"code": "ABC"}]
    assert _coding_code(codings) == "ABC"


def test_coding_code_empty_list():
    assert _coding_code([]) == ""


# ─── _patient_name ────────────────────────────────────────────────────────────

def test_patient_name_full():
    resource = {"name": [{"given": ["Jane", "Marie"], "family": "Smith"}]}
    assert _patient_name(resource) == "Jane Marie Smith"


def test_patient_name_no_given():
    resource = {"name": [{"family": "Smith"}]}
    assert _patient_name(resource) == "Smith"


def test_patient_name_empty_names():
    assert _patient_name({"name": []}) == "Unknown"


def test_patient_name_missing_key():
    assert _patient_name({}) == "Unknown"


# ─── _patient_mrn ─────────────────────────────────────────────────────────────

def test_patient_mrn_official_use():
    resource = {"identifier": [
        {"use": "usual", "value": "USUAL123"},
        {"use": "official", "value": "MRN456"},
    ]}
    assert _patient_mrn(resource) == "MRN456"


def test_patient_mrn_system_contains_mrn():
    resource = {"identifier": [
        {"system": "urn:oid:hospital.mrn", "value": "789"},
    ]}
    assert _patient_mrn(resource) == "789"


def test_patient_mrn_no_match():
    resource = {"identifier": [{"use": "temp", "value": "TEMP"}]}
    assert _patient_mrn(resource) == ""


def test_patient_mrn_no_identifiers():
    assert _patient_mrn({}) == ""


# ─── _parse_numeric ───────────────────────────────────────────────────────────

def test_parse_numeric_integer():
    assert _parse_numeric("42") == 42.0


def test_parse_numeric_decimal():
    assert _parse_numeric("7.4") == 7.4


def test_parse_numeric_with_trailing_unit():
    assert _parse_numeric("6.2 %") == 6.2


def test_parse_numeric_empty_string():
    assert _parse_numeric("") is None


def test_parse_numeric_non_numeric():
    assert _parse_numeric("positive") is None


def test_parse_numeric_negative():
    assert _parse_numeric("-5.0") == 5.0


# ─── _condition_to_entity ─────────────────────────────────────────────────────

def test_condition_to_entity_basic():
    pid = uuid.uuid4()
    res = {
        "id": "cond-1",
        "code": {"coding": [{"code": "73211009", "display": "Diabetes mellitus type 2"}]},
        "clinicalStatus": {"coding": [{"code": "active"}]},
        "onsetDateTime": "2020-03-15T00:00:00Z",
    }
    entity = _condition_to_entity(pid, res)
    assert entity.entity_type == "condition"
    assert entity.code == "73211009"
    assert entity.display == "Diabetes mellitus type 2"
    assert entity.status == "active"
    assert entity.onset_date == "2020-03-15"
    assert entity.patient_id == pid


def test_condition_to_entity_uses_text_fallback():
    pid = uuid.uuid4()
    res = {
        "id": "cond-2",
        "code": {"coding": [], "text": "Unknown condition"},
        "clinicalStatus": {"coding": [{"code": "inactive"}]},
    }
    entity = _condition_to_entity(pid, res)
    assert entity.display == "Unknown condition"


# ─── _medication_to_entity ────────────────────────────────────────────────────

def test_medication_to_entity_basic():
    pid = uuid.uuid4()
    res = {
        "id": "med-1",
        "medicationCodeableConcept": {
            "coding": [{"code": "372567009", "display": "Metformin"}],
        },
        "status": "active",
        "authoredOn": "2021-06-01",
    }
    entity = _medication_to_entity(pid, res)
    assert entity.entity_type == "medication"
    assert entity.display == "Metformin"
    assert entity.status == "active"
    assert entity.onset_date == "2021-06-01"


def test_medication_to_entity_text_fallback():
    pid = uuid.uuid4()
    res = {
        "id": "med-2",
        "medicationCodeableConcept": {"coding": [], "text": "Lisinopril 10mg"},
        "status": "stopped",
    }
    entity = _medication_to_entity(pid, res)
    assert entity.display == "Lisinopril 10mg"
    assert entity.status == "stopped"


# ─── _observation_to_entity ───────────────────────────────────────────────────

def test_observation_value_quantity():
    pid = uuid.uuid4()
    res = {
        "id": "obs-1",
        "code": {"coding": [{"code": "4548-4", "display": "HbA1c"}]},
        "status": "final",
        "effectiveDateTime": "2024-01-10T09:00:00Z",
        "valueQuantity": {"value": 7.4, "unit": "%"},
    }
    entity = _observation_to_entity(pid, res)
    assert entity.entity_type == "lab"
    assert entity.display == "HbA1c"
    assert entity.value == "7.4 %"
    assert entity.onset_date == "2024-01-10"


def test_observation_value_string():
    pid = uuid.uuid4()
    res = {
        "id": "obs-2",
        "code": {"coding": [{"code": "ABC", "display": "Culture"}]},
        "status": "final",
        "valueString": "No growth",
    }
    entity = _observation_to_entity(pid, res)
    assert entity.value == "No growth"


def test_observation_value_codeable_concept():
    pid = uuid.uuid4()
    res = {
        "id": "obs-3",
        "code": {"coding": [{"code": "XYZ", "display": "Blood type"}]},
        "status": "final",
        "valueCodeableConcept": {"text": "A positive"},
    }
    entity = _observation_to_entity(pid, res)
    assert entity.value == "A positive"


def test_observation_no_value():
    pid = uuid.uuid4()
    res = {
        "id": "obs-4",
        "code": {"coding": [{"code": "999", "display": "Unknown"}]},
        "status": "registered",
    }
    entity = _observation_to_entity(pid, res)
    assert entity.value == ""


# ─── _allergy_to_entity ───────────────────────────────────────────────────────

def test_allergy_to_entity_basic():
    pid = uuid.uuid4()
    res = {
        "id": "allergy-1",
        "code": {"coding": [{"code": "372687004", "display": "Penicillin"}]},
        "clinicalStatus": {"coding": [{"code": "active"}]},
        "onsetDateTime": "2015-05-01",
        "reaction": [{"description": "Anaphylaxis"}],
        "criticality": "high",
    }
    entity = _allergy_to_entity(pid, res)
    assert entity.entity_type == "allergy"
    assert entity.display == "Penicillin"
    assert entity.status == "active"
    assert entity.extra["reactions"] == ["Anaphylaxis"]
    assert entity.extra["criticality"] == "high"


# ─── _encounter_to_entity ─────────────────────────────────────────────────────

def test_encounter_to_entity_with_reason():
    pid = uuid.uuid4()
    res = {
        "id": "enc-1",
        "status": "finished",
        "class": {"code": "AMB"},
        "reasonCode": [{"text": "Diabetes follow-up"}],
        "period": {"start": "2024-03-01T10:00:00Z", "end": "2024-03-01T10:30:00Z"},
    }
    entity = _encounter_to_entity(pid, res)
    assert entity.entity_type == "encounter"
    assert entity.display == "Diabetes follow-up"
    assert entity.code == "AMB"
    assert entity.onset_date == "2024-03-01"


def test_encounter_to_entity_no_reason_falls_back():
    pid = uuid.uuid4()
    res = {
        "id": "enc-2",
        "status": "finished",
        "class": {"code": "IMP"},
        "period": {"start": "2024-04-15T08:00:00Z"},
    }
    entity = _encounter_to_entity(pid, res)
    assert entity.display == "Clinical encounter"


# ─── _compute_risk ────────────────────────────────────────────────────────────

def _lab_entity(display, value, date="2024-01-01"):
    e = MagicMock()
    e.entity_type = "lab"
    e.display = display
    e.value = value
    e.onset_date = date
    return e


def _condition_entity(display, status="active"):
    e = MagicMock()
    e.entity_type = "condition"
    e.display = display
    e.status = status
    return e


def _med_entity(display, status="active"):
    e = MagicMock()
    e.entity_type = "medication"
    e.display = display
    e.status = status
    return e


def test_compute_risk_stable_no_flags():
    result = _compute_risk([])
    assert result["level"] == "stable"
    assert result["flag_count"] == 0


def test_compute_risk_critical_egfr():
    ents = [_lab_entity("eGFR", "22", "2024-01-01")]
    result = _compute_risk(ents)
    assert result["level"] == "critical"
    assert any("eGFR" in f for f in result["flags"])


def test_compute_risk_watch_egfr():
    ents = [_lab_entity("eGFR", "38", "2024-01-01")]
    result = _compute_risk(ents)
    assert result["level"] == "watch"


def test_compute_risk_critical_hba1c():
    ents = [_lab_entity("HbA1c", "9.5", "2024-01-01")]
    result = _compute_risk(ents)
    assert result["level"] == "critical"
    assert any("HbA1c" in f for f in result["flags"])


def test_compute_risk_ckd_without_ace_arb():
    ents = [
        _condition_entity("Chronic kidney disease"),
        _med_entity("Amlodipine"),
    ]
    result = _compute_risk(ents)
    assert any("ACE" in f for f in result["flags"])
    assert result["level"] == "watch"


def test_compute_risk_ckd_with_ace_arb_no_flag():
    ents = [
        _condition_entity("CKD stage 3"),
        _med_entity("lisinopril 10mg"),
    ]
    result = _compute_risk(ents)
    assert not any("ACE" in f for f in result["flags"])


def test_compute_risk_egfr_declining():
    ents = [
        _lab_entity("eGFR", "60", "2022-01-01"),
        _lab_entity("eGFR", "45", "2023-01-01"),
        _lab_entity("eGFR", "30", "2024-01-01"),
    ]
    result = _compute_risk(ents)
    assert result["level"] in ("watch", "critical")


def test_compute_risk_elevated_bnp():
    ents = [_lab_entity("NT-proBNP", "1200", "2024-01-01")]
    result = _compute_risk(ents)
    assert any("NT-proBNP" in f for f in result["flags"])
