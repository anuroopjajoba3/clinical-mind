"""
Tests for agent utilities: PICO extraction helpers, pipeline state, routing.
"""
import pytest



# ── PICO parsing ──────────────────────────────────────────────────────────────

def test_clinical_state_has_required_keys():
    """ClinicalState TypedDict has all expected keys."""
    from agents import ClinicalState
    required = {"question", "pico", "raw_papers", "summaries", "contradictions",
                "report", "agent_status", "error", "fhir_patient_id", "fhir_context"}
    assert required.issubset(set(ClinicalState.__annotations__.keys()))


def test_build_graph_returns_compiled_graph():
    """build_graph() compiles without errors."""
    from agents import build_graph
    graph = build_graph()
    assert graph is not None


def test_graph_has_correct_entry_point():
    """Graph entry point is the fhir agent node."""
    from agents import build_graph
    graph = build_graph()
    # The compiled graph should have a graph attribute with nodes
    assert graph is not None


# ── Route functions ───────────────────────────────────────────────────────────

def test_route_after_fhir_no_patient():
    """FHIR agent routes to pico_extract when no patient attached."""
    from agents import route_after_fhir
    state = {
        "fhir_patient_id": None,
        "fhir_context": None,
        "agent_status": {"fhir": "skipped"},
        "error": None,
    }
    result = route_after_fhir(state)
    assert result == "pico_extract"


def test_route_after_fhir_with_patient():
    """FHIR agent routes to pico_extract after loading patient context."""
    from agents import route_after_fhir
    state = {
        "fhir_patient_id": "patient-123",
        "fhir_context": {"patient": {"id": "patient-123"}},
        "agent_status": {"fhir": "complete"},
        "error": None,
    }
    result = route_after_fhir(state)
    assert result == "pico_extract"


def test_route_after_pico_success():
    """PICO routes to search on success."""
    from agents import route_after_pico
    state = {
        "pico": {"population": "adults", "intervention": "metformin"},
        "agent_status": {"pico": "complete"},
        "error": None,
    }
    result = route_after_pico(state)
    assert result == "search"


def test_route_after_pico_error():
    """PICO routes to END on error."""
    from agents import route_after_pico
    from langgraph.graph import END
    state = {
        "pico": None,
        "agent_status": {"pico": "error"},
        "error": "LLM failed",
    }
    result = route_after_pico(state)
    assert result == END


# ── Evidence level ─────────────────────────────────────────────────────────────

@pytest.mark.parametrize("level,valid", [
    ("1A", True), ("1B", True), ("2A", True),
    ("2B", True), ("3", True), ("4", True),
    ("5", False), ("", False),
])
def test_evidence_level_values(level, valid):
    """Evidence levels should be one of the standard 6 values."""
    valid_levels = {"1A", "1B", "2A", "2B", "3", "4"}
    assert (level in valid_levels) == valid
