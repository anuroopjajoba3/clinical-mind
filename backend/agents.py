"""
LangGraph multi-agent pipeline — Production version.

5-agent pipeline:
  0. PICO Agent         — extracts Population/Intervention/Comparison/Outcome + builds MeSH query
  1. Search Agent       — parallel search: PubMed + ClinicalTrials.gov
  2. Summarizer Agent   — Claude extracts structured data from each paper/trial
  3. Contradiction Agent— Claude flags conflicting findings across papers
  4. Synthesize Agent   — Claude produces the final structured clinical report
"""

import os
import re
import json
import asyncio
from typing import TypedDict, Optional

from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

from pubmed import get_clinical_papers
from clinicaltrials import search_clinical_trials
from fhir_client import get_patient, get_encounters_for_patient, get_appointments_for_patient


# ─── State Schema ────────────────────────────────────────────────────────────

class PICOExtract(TypedDict):
    population: str
    intervention: str
    comparison: str
    outcome: str
    pubmed_query: str
    clinicaltrials_query: str


class PaperSummary(TypedDict):
    pmid: str
    title: str
    authors: str
    journal: str
    year: str
    url: str
    source: str          # "PubMed" | "ClinicalTrials.gov"
    intervention: str
    population: str
    sample_size: str
    key_outcomes: str
    evidence_quality: str
    evidence_level: str  # "1A" | "1B" | "2A" | "2B" | "3" | "4"
    is_trial: bool


class ClinicalState(TypedDict):
    question: str
    job_id: str
    # Optional FHIR patient context
    fhir_patient_id: Optional[str]
    fhir_context: Optional[dict]       # patient demographics + recent encounters/appts
    pico: Optional[PICOExtract]
    raw_papers: list[dict]
    summaries: list[PaperSummary]
    contradictions: list[dict]
    report: dict
    agent_status: dict
    error: Optional[str]


# ─── LLM ─────────────────────────────────────────────────────────────────────

def get_llm(max_tokens: int = 4096) -> ChatAnthropic:
    return ChatAnthropic(
        model="claude-sonnet-4-20250514",
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
        max_tokens=max_tokens,
        temperature=0.1,
    )


def _strip_json(raw: str) -> str:
    """Remove markdown code fences if Claude wraps the JSON."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()


# ─── Agent 0a: FHIR Context Agent ───────────────────────────────────────────

async def fhir_context_agent(state: ClinicalState) -> ClinicalState:
    """
    Optionally fetches Patient, Encounter, and Appointment data from the FHIR
    server and attaches it as context for the downstream agents.

    If no fhir_patient_id is provided this agent is a no-op — the pipeline
    proceeds exactly as before for unauthenticated / non-FHIR queries.
    """
    state["agent_status"]["fhir"] = "running"
    patient_id = state.get("fhir_patient_id")

    if not patient_id:
        state["agent_status"]["fhir"] = "skipped"
        state["fhir_context"] = None
        return state

    try:
        # Parallel fetch: patient + encounters + appointments
        patient, encounters, appointments = await asyncio.gather(
            get_patient(patient_id),
            get_encounters_for_patient(patient_id),
            get_appointments_for_patient(patient_id),
            return_exceptions=True,
        )

        def safe(r):
            return r if not isinstance(r, Exception) else {}

        patient     = safe(patient)
        encounters  = safe(encounters)  if not isinstance(encounters, Exception)  else []
        appointments= safe(appointments) if not isinstance(appointments, Exception) else []

        # Extract human-readable name
        name_block = patient.get("name", [{}])[0]
        given  = " ".join(name_block.get("given", []))
        family = name_block.get("family", "")
        dob    = patient.get("birthDate", "unknown")
        gender = patient.get("gender", "unknown")

        # Summarise last 5 encounters
        enc_summaries = []
        for e in encounters[:5]:
            reason = ""
            reason_codes = e.get("reasonCode", [{}])
            if reason_codes:
                reason = reason_codes[0].get("text", "") or \
                         reason_codes[0].get("coding", [{}])[0].get("display", "")
            period = e.get("period", {})
            enc_summaries.append({
                "id": e.get("id"),
                "status": e.get("status"),
                "reason": reason,
                "start": period.get("start", ""),
                "class": e.get("class", {}).get("code", ""),
            })

        # Summarise upcoming appointments
        appt_summaries = []
        for a in appointments[:5]:
            appt_summaries.append({
                "id": a.get("id"),
                "status": a.get("status"),
                "description": a.get("description", ""),
                "start": a.get("start", ""),
            })

        state["fhir_context"] = {
            "patient_id": patient_id,
            "name": f"{given} {family}".strip(),
            "dob": dob,
            "gender": gender,
            "encounters": enc_summaries,
            "appointments": appt_summaries,
        }
        state["agent_status"]["fhir"] = "complete"

    except Exception as e:
        print(f"FHIR context agent error: {e}")
        state["fhir_context"] = None
        state["agent_status"]["fhir"] = "error"

    return state


# ─── Agent 0: PICO Extractor ─────────────────────────────────────────────────

PICO_SYSTEM = """You are a clinical research librarian expert in evidence-based medicine.
Extract a PICO framework from the clinical question and generate optimised search queries.
Return ONLY valid JSON, no markdown fences.

JSON schema:
{
  "population": "specific patient population",
  "intervention": "specific treatment or exposure",
  "comparison": "comparator (or 'placebo/standard care' if not specified)",
  "outcome": "primary outcome of interest",
  "pubmed_query": "PubMed-optimised query using MeSH terms and Boolean operators, max 100 chars",
  "clinicaltrials_query": "ClinicalTrials.gov search string, max 60 chars"
}

pubmed_query rules:
- Use MeSH terms in quotes where possible: "Diabetes Mellitus, Type 2"[MeSH]
- Combine with AND/OR/NOT
- Add [tiab] for title/abstract search on non-MeSH terms
- Include study type filter where appropriate: "randomized controlled trial"[PT]
- Example: "GLP-1 receptor agonists"[tiab] AND "Diabetes Mellitus, Type 2"[MeSH]
"""


async def pico_agent(state: ClinicalState) -> ClinicalState:
    """Extracts PICO components and builds optimised search queries."""
    state["agent_status"]["pico"] = "running"
    llm = get_llm(max_tokens=1024)

    # Enrich query with FHIR patient context when available
    question = state["question"]
    fhir_ctx = state.get("fhir_context")
    if fhir_ctx:
        enc_text = "; ".join(
            f"{e['reason']} ({e['start'][:10]})"
            for e in fhir_ctx.get("encounters", [])[:3] if e.get("reason")
        )
        question = (
            f"{question}\n\n"
            f"[Patient context from EMR — {fhir_ctx['name']}, "
            f"DOB {fhir_ctx['dob']}, {fhir_ctx['gender']}. "
            f"Recent encounters: {enc_text or 'none recorded'}]"
        )

    try:
        response = await llm.ainvoke([
            SystemMessage(content=PICO_SYSTEM),
            HumanMessage(content=f"Clinical question: {question}"),
        ])
        pico = json.loads(_strip_json(response.content))
        state["pico"] = PICOExtract(**pico)
        state["agent_status"]["pico"] = "complete"
    except Exception as e:
        # Non-fatal: fall back to keyword extraction
        print(f"PICO extraction failed: {e}")
        keywords = _keyword_fallback(state["question"])
        state["pico"] = PICOExtract(
            population="patients",
            intervention=keywords,
            comparison="standard care",
            outcome="clinical outcomes",
            pubmed_query=f"{keywords} randomized controlled trial",
            clinicaltrials_query=keywords,
        )
        state["agent_status"]["pico"] = "complete"

    return state


def _keyword_fallback(question: str) -> str:
    """Strip question words and return medical keyword string."""
    stopwords = r'\b(what|is|are|the|of|for|how|does|do|in|a|an|to|with|and|or|its|their|this|that|these|those|be|been|being|have|has|had|will|would|could|should|may|might|on|at|by|from|about|as|into|through|during|efficacy|effect|effects|role|use|management|treatment|therapy|compared|versus|vs)\b'
    clean = re.sub(stopwords, ' ', question, flags=re.IGNORECASE)
    clean = re.sub(r'[?!.,;:]', ' ', clean)
    return re.sub(r'\s+', ' ', clean).strip()


# ─── Agent 1: Search Agent ───────────────────────────────────────────────────

async def search_agent(state: ClinicalState) -> ClinicalState:
    """Parallel search: PubMed + ClinicalTrials.gov using PICO-derived queries."""
    state["agent_status"]["search"] = "running"

    pico = state.get("pico")
    pubmed_query = pico["pubmed_query"] if pico else _keyword_fallback(state["question"])
    ct_query = pico["clinicaltrials_query"] if pico else _keyword_fallback(state["question"])

    # Run both searches in parallel
    pubmed_task = get_clinical_papers(pubmed_query, max_results=5)
    ct_task = search_clinical_trials(ct_query, max_results=3)

    pubmed_papers, ct_trials = await asyncio.gather(pubmed_task, ct_task, return_exceptions=True)

    if isinstance(pubmed_papers, Exception):
        print(f"PubMed error: {pubmed_papers}")
        pubmed_papers = []
    if isinstance(ct_trials, Exception):
        print(f"ClinicalTrials error: {ct_trials}")
        ct_trials = []

    # Fallback: try broader PubMed query if no results
    if not pubmed_papers:
        fallback_q = _keyword_fallback(state["question"])
        pubmed_papers = await get_clinical_papers(fallback_q, max_results=5)

    # Tag source
    for p in pubmed_papers:
        p.setdefault("source", "PubMed")
        p.setdefault("is_trial", False)
    for t in ct_trials:
        t["source"] = "ClinicalTrials.gov"

    all_papers = pubmed_papers + ct_trials

    if not all_papers:
        state["agent_status"]["search"] = "error"
        state["error"] = (
            "No papers or trials found. Try rephrasing with specific drug names or conditions "
            "(e.g. 'semaglutide type 2 diabetes HbA1c')."
        )
        return state

    state["raw_papers"] = all_papers
    state["agent_status"]["search"] = "complete"
    return state


# ─── Agent 2: Summarizer Agent ───────────────────────────────────────────────

SUMMARIZER_SYSTEM = """You are a clinical research analyst. Given a paper or clinical trial,
extract structured information in JSON format. Return ONLY valid JSON, no markdown fences.

JSON schema:
{
  "intervention": "specific treatment/intervention studied",
  "population": "patient population (age, condition, inclusion criteria)",
  "sample_size": "number of participants (or estimated enrollment for trials)",
  "key_outcomes": "primary and secondary outcomes in 2-3 sentences",
  "evidence_quality": "study design (RCT, meta-analysis, cohort, Phase III trial, etc.)",
  "evidence_level": "one of: 1A, 1B, 2A, 2B, 3, 4"
}

Evidence level guide:
- 1A: Systematic review or meta-analysis of RCTs
- 1B: Individual high-quality RCT or Phase III trial
- 2A: Systematic review of cohort studies
- 2B: Cohort study, Phase II trial, or low-quality RCT
- 3: Case-control, Phase I trial, or case series
- 4: Expert opinion, case report, or Phase 0
"""


async def summarize_single(llm: ChatAnthropic, paper: dict) -> PaperSummary:
    source = paper.get("source", "PubMed")
    is_trial = paper.get("is_trial", False)

    if is_trial:
        content = f"""Title: {paper['title']}
Source: ClinicalTrials.gov ({paper.get('status', 'Unknown status')})
Phase: {paper.get('phase', 'N/A')}
Enrollment: {paper.get('enrollment', 'N/A')}
Intervention: {paper.get('intervention', 'N/A')}
Condition: {paper.get('condition', 'N/A')}
Primary Outcome: {paper.get('primary_outcome', 'N/A')}

Summary:
{paper['abstract']}"""
    else:
        content = f"""Title: {paper['title']}
Authors: {paper.get('authors', 'Unknown')}
Journal: {paper.get('journal', 'Unknown')} ({paper.get('year', 'N/A')})

Abstract:
{paper['abstract']}"""

    try:
        response = await llm.ainvoke([
            SystemMessage(content=SUMMARIZER_SYSTEM),
            HumanMessage(content=content),
        ])
        extracted = json.loads(_strip_json(response.content))
    except Exception as e:
        print(f"Summariser error for {paper.get('pmid', '?')}: {e}")
        extracted = {
            "intervention": paper.get("intervention", "Unable to extract"),
            "population": "Unknown",
            "sample_size": paper.get("enrollment", "Unknown"),
            "key_outcomes": paper.get("abstract", "")[:300],
            "evidence_quality": "Unknown",
            "evidence_level": "4",
        }

    return PaperSummary(
        pmid=paper.get("pmid", "N/A"),
        title=paper.get("title", "No title"),
        authors=paper.get("authors", "Unknown"),
        journal=paper.get("journal", "Unknown"),
        year=paper.get("year", "N/A"),
        url=paper.get("url", "#"),
        source=source,
        intervention=extracted.get("intervention", "N/A"),
        population=extracted.get("population", "N/A"),
        sample_size=extracted.get("sample_size", "N/A"),
        key_outcomes=extracted.get("key_outcomes", "N/A"),
        evidence_quality=extracted.get("evidence_quality", "N/A"),
        evidence_level=extracted.get("evidence_level", "4"),
        is_trial=is_trial,
    )


async def summarizer_agent(state: ClinicalState) -> ClinicalState:
    """Summarises all papers and trials via Claude (parallel)."""
    state["agent_status"]["summarizer"] = "running"

    if not state.get("raw_papers"):
        state["agent_status"]["summarizer"] = "error"
        state["error"] = "No papers to summarise."
        return state

    llm = get_llm()
    tasks = [summarize_single(llm, p) for p in state["raw_papers"]]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    state["summaries"] = [s for s in results if not isinstance(s, Exception)]
    state["agent_status"]["summarizer"] = "complete"
    return state


# ─── Agent 3: Contradiction Detector ─────────────────────────────────────────

CONTRADICTION_SYSTEM = """You are a clinical evidence analyst. Given a list of paper summaries,
identify contradictions — cases where papers reach opposing conclusions about the same intervention.
Return ONLY valid JSON, no markdown fences.

JSON schema:
{
  "contradictions": [
    {
      "paper_a_title": "...",
      "paper_b_title": "...",
      "conflict": "one sentence describing the contradiction",
      "severity": "major | minor"
    }
  ],
  "consistency_note": "brief overall assessment of evidence consistency"
}

Return {"contradictions": [], "consistency_note": "..."} if no contradictions found.
"""


async def contradiction_agent(state: ClinicalState) -> ClinicalState:
    """Detects conflicting findings across papers."""
    state["agent_status"]["contradiction"] = "running"

    summaries = state.get("summaries", [])
    if len(summaries) < 2:
        state["contradictions"] = []
        state["agent_status"]["contradiction"] = "complete"
        return state

    summary_block = "\n\n".join(
        f"Paper {i+1}: {s['title']}\n  Outcomes: {s['key_outcomes']}\n  Evidence level: {s['evidence_level']}"
        for i, s in enumerate(summaries)
    )

    llm = get_llm(max_tokens=1024)
    try:
        response = await llm.ainvoke([
            SystemMessage(content=CONTRADICTION_SYSTEM),
            HumanMessage(content=f"Clinical question: {state['question']}\n\nPapers:\n{summary_block}"),
        ])
        result = json.loads(_strip_json(response.content))
        state["contradictions"] = result.get("contradictions", [])
        # Attach consistency note to report dict
        state.setdefault("report", {})["consistency_note"] = result.get("consistency_note", "")
    except Exception as e:
        print(f"Contradiction agent error: {e}")
        state["contradictions"] = []

    state["agent_status"]["contradiction"] = "complete"
    return state


# ─── Agent 4: Synthesize Agent ────────────────────────────────────────────────

REPORT_SYSTEM = """You are a senior clinical evidence specialist writing a structured
clinical evidence report for healthcare professionals. Return ONLY valid JSON, no markdown.

JSON schema:
{
  "background": "2-3 sentence clinical context",
  "key_interventions": [
    {"name": "...", "evidence_level": "1A/1B/2A/etc", "summary": "one sentence"}
  ],
  "evidence_summary": "3-4 paragraph synthesis (separate paragraphs with \\n\\n)",
  "recommendations": [
    {"rank": 1, "recommendation": "...", "rationale": "...", "evidence_level": "..."}
  ],
  "clinical_bottom_line": "1-2 sentence actionable take-away",
  "limitations": "key gaps and limitations in the evidence base",
  "grade_assessment": "overall GRADE evidence quality: High / Moderate / Low / Very Low"
}
"""


async def synthesize_agent(state: ClinicalState) -> ClinicalState:
    """Synthesises all evidence into a structured clinical report."""
    state["agent_status"]["synthesize"] = "running"

    if not state.get("summaries"):
        state["agent_status"]["synthesize"] = "error"
        state["error"] = "No summaries to synthesise."
        return state

    pico = state.get("pico")
    pico_block = ""
    if pico:
        pico_block = f"""
PICO Framework:
  Population:    {pico['population']}
  Intervention:  {pico['intervention']}
  Comparison:    {pico['comparison']}
  Outcome:       {pico['outcome']}
"""

    summaries_text = ""
    for i, s in enumerate(state["summaries"], 1):
        tag = "🧪 Trial" if s.get("is_trial") else "📄 Paper"
        summaries_text += f"""
{tag} {i}: {s['title']} ({s['year']}) [{s['source']}]
  Intervention:  {s['intervention']}
  Population:    {s['population']}
  Sample size:   {s['sample_size']}
  Outcomes:      {s['key_outcomes']}
  Design:        {s['evidence_quality']}
  Level:         {s['evidence_level']}
"""

    contradictions_text = ""
    if state.get("contradictions"):
        contradictions_text = "\nConflicting findings:\n" + "\n".join(
            f"  - {c['conflict']} (severity: {c['severity']})"
            for c in state["contradictions"]
        )

    prompt = f"""Clinical Question: {state['question']}
{pico_block}
Evidence from {len(state['summaries'])} sources ({sum(1 for s in state['summaries'] if s.get('is_trial'))} trials, {sum(1 for s in state['summaries'] if not s.get('is_trial'))} published papers):
{summaries_text}{contradictions_text}

Generate a comprehensive structured clinical evidence report."""

    llm = get_llm()
    try:
        response = await llm.ainvoke([
            SystemMessage(content=REPORT_SYSTEM),
            HumanMessage(content=prompt),
        ])
        report = json.loads(_strip_json(response.content))
        # Merge consistency note if set by contradiction agent
        if state.get("report", {}).get("consistency_note"):
            report["consistency_note"] = state["report"]["consistency_note"]
    except Exception as e:
        print(f"Synthesize error: {e}")
        report = {
            "background": f"Clinical synthesis for: {state['question']}",
            "key_interventions": [],
            "evidence_summary": "Report generation encountered an error. Please review individual paper summaries.",
            "recommendations": [],
            "clinical_bottom_line": "Manual review of evidence recommended.",
            "limitations": "Automated synthesis unavailable.",
            "grade_assessment": "Unable to assess",
        }

    state["report"] = report
    state["agent_status"]["synthesize"] = "complete"
    return state


# ─── Routing ─────────────────────────────────────────────────────────────────

def route_after_fhir(state: ClinicalState) -> str:
    return END if state.get("error") else "pico_extract"

def route_after_pico(state: ClinicalState) -> str:
    return END if state.get("error") else "search"

def route_after_search(state: ClinicalState) -> str:
    return END if state.get("error") else "summarizer"

def route_after_summarizer(state: ClinicalState) -> str:
    return END if state.get("error") else "contradiction"

def route_after_contradiction(state: ClinicalState) -> str:
    return END if state.get("error") else "synthesize"


# ─── Build Graph ─────────────────────────────────────────────────────────────

def build_graph():
    graph = StateGraph(ClinicalState)

    graph.add_node("fhir",          fhir_context_agent)
    graph.add_node("pico_extract",  pico_agent)
    graph.add_node("search",        search_agent)
    graph.add_node("summarizer",    summarizer_agent)
    graph.add_node("contradiction", contradiction_agent)
    graph.add_node("synthesize",    synthesize_agent)

    graph.set_entry_point("fhir")

    graph.add_conditional_edges("fhir",          route_after_fhir,          {"pico_extract": "pico_extract", END: END})
    graph.add_conditional_edges("pico_extract",  route_after_pico,          {"search": "search", END: END})
    graph.add_conditional_edges("search",         route_after_search,        {"summarizer": "summarizer", END: END})
    graph.add_conditional_edges("summarizer",     route_after_summarizer,    {"contradiction": "contradiction", END: END})
    graph.add_conditional_edges("contradiction",  route_after_contradiction, {"synthesize": "synthesize", END: END})
    graph.add_edge("synthesize", END)

    return graph.compile()


clinical_graph = build_graph()
