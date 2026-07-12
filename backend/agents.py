"""
LangGraph multi-agent pipeline — Production version.

8-agent pipeline (Claude API primary, OpenAI API fallback):
  0. FHIR Context Agent — loads patient memory (conditions, meds, labs, allergies)
  1. PICO Agent         — extracts Population/Intervention/Comparison/Outcome + builds MeSH query
  2. Search Agent       — parallel search: PubMed + ClinicalTrials.gov
  3. Summarizer Agent   — extracts structured data from each paper/trial
  4. Contradiction Agent— flags conflicting findings across papers
  5. Drug Interaction   — checks recommendations against current medications
  6. Synthesize Agent   — produces the final structured clinical report
  7. Follow-up Agent    — generates next-step clinical questions
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
    # Prior Q&A pairs in this session for continuity
    session_history: list[dict]        # [{"question": str, "answer": str}, ...]
    pico: Optional[PICOExtract]
    raw_papers: list[dict]
    summaries: list[PaperSummary]
    contradictions: list[dict]
    report: dict
    agent_status: dict
    error: Optional[str]


# ─── LLM ─────────────────────────────────────────────────────────────────────

def get_llm(max_tokens: int = 8192):
    """
    Primary model: Claude (Anthropic API).
    Fallback: OpenAI API — attached automatically when OPENAI_API_KEY is set,
    so transient Claude errors or rate limits don't fail the pipeline.
    """
    claude = ChatAnthropic(
        model="claude-sonnet-4-20250514",
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
        max_tokens=max_tokens,
        temperature=0.1,
    )

    if os.getenv("OPENAI_API_KEY"):
        try:
            from langchain_openai import ChatOpenAI
            openai_fallback = ChatOpenAI(
                model="gpt-4o-mini",
                api_key=os.getenv("OPENAI_API_KEY"),
                max_tokens=max_tokens,
                temperature=0.1,
            )
            return claude.with_fallbacks([openai_fallback])
        except ImportError:
            pass  # langchain-openai not installed — run Claude-only

    return claude


def _strip_json(raw: str) -> str:
    """Remove markdown code fences if Claude wraps the JSON."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()


# Evidence level → base score mapping (Oxford CEBM ladder)
_LEVEL_BASE = {"1A": 95, "1B": 82, "2A": 68, "2B": 55, "3": 40, "4": 25}


def _compute_confidence(
    recommendations: list[dict],
    summaries: list[dict],
    contradictions: list[dict],
) -> list[dict]:
    """
    Annotate each recommendation with a confidence_score (0–100) derived from
    three signals already present in the pipeline state:

      1. Evidence level of cited sources  — 1A anchors at 95, 4 at 25
      2. Number of distinct source refs   — more refs add up to +12 pts (log scale)
      3. Contradictions on cited sources  — each conflict touching a cited source
                                            subtracts 8 pts (major) or 4 pts (minor)

    No LLM call — pure arithmetic over data already computed by earlier agents.
    """
    # Build a set of source indices (1-based) that are involved in contradictions,
    # keyed by severity so we can apply different penalties.
    conflict_indices: dict[int, str] = {}   # index → "major" | "minor"
    for c in contradictions or []:
        severity = c.get("severity", "minor")
        for ref in c.get("source_refs", []):
            try:
                idx = int(ref)
                # Keep the worst severity if a source appears in multiple conflicts
                if conflict_indices.get(idx) != "major":
                    conflict_indices[idx] = severity
            except (ValueError, TypeError):
                pass

    annotated = []
    for rec in recommendations:
        refs = [int(r) for r in (rec.get("source_refs") or []) if str(r).isdigit()]

        if not refs:
            # No citations — use the rec's own evidence_level as sole signal
            base = _LEVEL_BASE.get(rec.get("evidence_level", "4"), 25)
            score = max(10, base - 15)      # penalise uncited recommendations
        else:
            # Average the base scores of all cited sources
            levels = []
            for idx in refs:
                if 1 <= idx <= len(summaries):
                    lvl = summaries[idx - 1].get("evidence_level", "4")
                    levels.append(_LEVEL_BASE.get(lvl, 25))
            base = sum(levels) / len(levels) if levels else _LEVEL_BASE.get(
                rec.get("evidence_level", "4"), 25
            )

            # Bonus for multiple independent citations (log scale, cap +12)
            import math
            multi_bonus = min(12, round(math.log(len(refs) + 1, 2) * 6))

            # Contradiction penalty for cited sources
            penalty = sum(
                8 if conflict_indices.get(idx) == "major" else 4
                for idx in refs
                if idx in conflict_indices
            )

            score = base + multi_bonus - penalty

        rec = {**rec, "confidence_score": max(5, min(100, round(score)))}
        annotated.append(rec)

    return annotated


# ─── Agent 0a: Patient Memory Agent ─────────────────────────────────────────

async def fhir_context_agent(state: ClinicalState) -> ClinicalState:
    """
    Reads the full patient memory from PostgreSQL (conditions, medications,
    labs, allergies, encounters) and builds a rich clinical context block
    that downstream agents use to personalise their reasoning.

    If no fhir_patient_id is provided this agent is a no-op.
    """
    state["agent_status"]["fhir"] = "running"
    patient_id = state.get("fhir_patient_id")

    if not patient_id:
        state["agent_status"]["fhir"] = "skipped"
        state["fhir_context"] = None
        return state

    try:
        import httpx
        backend_url = os.getenv("BACKEND_SELF_URL", "http://localhost:8000")
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{backend_url}/patients/{patient_id}")

        if resp.status_code == 404:
            state["agent_status"]["fhir"] = "skipped"
            state["fhir_context"] = None
            return state

        resp.raise_for_status()
        summary = resp.json()

        # Build structured context the LLM can reason over
        conditions = [
            f"{c['display']} ({c['status']})"
            for c in summary.get("conditions", [])
            if c.get("display")
        ]
        medications = [
            c["display"] for c in summary.get("medications", [])
            if c.get("display") and c.get("status") == "active"
        ]
        # Most-recent value per lab for point-in-time context
        latest_labs: dict[str, dict] = {}
        for lab in summary.get("labs", []):
            name = lab.get("display", "")
            if name and lab.get("value"):
                # labs are sorted ascending by date — last one wins
                latest_labs[name] = lab

        labs = [
            f"{name}: {entry['value']} ({entry['date']})"
            for name, entry in latest_labs.items()
        ]

        # Build lab trend strings for AI context (e.g. "HbA1c: 6.2% → 6.9% → 7.4% → 7.8%")
        lab_trends_raw = summary.get("lab_trends", {})
        lab_trend_lines = []
        for lab_name, readings in lab_trends_raw.items():
            if len(readings) >= 2:
                values = " → ".join(
                    f"{r['value']} ({r['date']})" for r in readings
                )
                lab_trend_lines.append(f"{lab_name}: {values}")

        allergies = [
            a["display"]
            for a in summary.get("allergies", [])
            if a.get("display")
        ]

        state["fhir_context"] = {
            "patient_id":  patient_id,
            "name":        summary["full_name"],
            "dob":         summary["birth_date"],
            "gender":      summary["gender"],
            "mrn":         summary["mrn"],
            "conditions":  conditions,
            "medications": medications,
            "labs":        labs,
            "lab_trends":  lab_trend_lines,   # longitudinal trajectory strings
            "allergies":   allergies,
            "encounters":  summary.get("encounters", []),
        }
        state["agent_status"]["fhir"] = "complete"

    except Exception as e:
        print(f"Patient memory agent error: {e}")
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

    # Enrich query with full patient memory context
    question = state["question"]
    fhir_ctx = state.get("fhir_context")
    if fhir_ctx:
        lines = [
            f"Patient: {fhir_ctx['name']}, DOB {fhir_ctx['dob']}, {fhir_ctx['gender']} ({fhir_ctx.get('mrn', '')})",
        ]
        if fhir_ctx.get("conditions"):
            lines.append("Active conditions: " + "; ".join(fhir_ctx["conditions"][:6]))
        if fhir_ctx.get("medications"):
            lines.append("Current medications: " + "; ".join(fhir_ctx["medications"][:6]))
        if fhir_ctx.get("labs"):
            lines.append("Latest labs: " + "; ".join(fhir_ctx["labs"][:6]))
        if fhir_ctx.get("lab_trends"):
            lines.append("Lab trajectories (oldest → newest):")
            for trend in fhir_ctx["lab_trends"][:4]:
                lines.append(f"  • {trend}")
        if fhir_ctx.get("allergies"):
            lines.append("Allergies: " + "; ".join(fhir_ctx["allergies"]))
        patient_block = "\n".join(lines)
        question = (
            f"{question}\n\n"
            f"[Patient EMR context — use lab trajectories to identify trends "
            f"and personalise PICO. Flag contraindications and progression patterns.]\n{patient_block}"
        )

    # Inject session history so PICO understands clinical conversation continuity
    session_history = state.get("session_history") or []
    if session_history:
        history_lines = []
        for entry in session_history[-3:]:  # cap at last 3 exchanges
            history_lines.append(f"Q: {entry['question']}")
            history_lines.append(f"A (summary): {entry['answer']}")
        question = (
            f"{question}\n\n"
            f"[Session context — prior clinical questions asked in this session. "
            f"Build on these, avoid repeating covered ground, and be progressive.]\n"
            + "\n".join(history_lines)
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


async def summarize_single(llm, paper: dict) -> PaperSummary:
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


# ─── Agent 3: Contradiction Detector (powered by Meditron via Ollama) ────────

CONTRADICTION_PROMPT = """You are a medical evidence analyst. Analyse these paper summaries and identify contradictions — cases where papers reach opposing conclusions about the same intervention or treatment.

Return ONLY valid JSON, no markdown, no explanation outside the JSON.

Schema:
{{
  "contradictions": [
    {{
      "paper_a_title": "...",
      "paper_b_title": "...",
      "conflict": "one sentence describing the contradiction",
      "severity": "major | minor"
    }}
  ],
  "consistency_note": "brief overall assessment of evidence consistency"
}}

Return {{"contradictions": [], "consistency_note": "consistent"}} if no contradictions found.

Clinical question: {question}

Paper summaries:
{summaries}"""


def _get_meditron():
    """Returns a Meditron LLM via Ollama. Falls back to Claude if Ollama is unavailable."""
    try:
        from langchain_ollama import ChatOllama
        return ChatOllama(model="meditron", temperature=0.1, num_predict=1024)
    except Exception:
        return None


async def contradiction_agent(state: ClinicalState) -> ClinicalState:
    """
    Detects conflicting findings across papers using Meditron (local medical LLM).
    Falls back to Claude if Ollama is not available.
    """
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

    prompt_text = CONTRADICTION_PROMPT.format(
        question=state["question"],
        summaries=summary_block,
    )

    # Try Meditron first (30s timeout), fall back to Claude
    meditron = _get_meditron()
    raw = None
    used_meditron = False
    if meditron:
        try:
            print("Contradiction agent: trying Meditron (local medical LLM, 30s timeout)")
            response = await asyncio.wait_for(
                meditron.ainvoke(prompt_text),
                timeout=30.0,
            )
            raw = response.content
            used_meditron = True
            print("Contradiction agent: Meditron responded")
        except asyncio.TimeoutError:
            print("Contradiction agent: Meditron timed out, falling back to Claude")
            raw = None
        except Exception as e:
            print(f"Contradiction agent: Meditron error ({e}), falling back to Claude")
            raw = None

    try:
        # If Meditron replied but with unparseable JSON, fall back to Claude too
        if raw is not None:
            try:
                json.loads(_strip_json(raw))
            except json.JSONDecodeError:
                print("Contradiction agent: Meditron output unparseable, falling back to Claude")
                raw = None
                used_meditron = False

        if raw is None:
            print("Contradiction agent: using Claude")
            llm = get_llm(max_tokens=1024)
            response = await llm.ainvoke([
                SystemMessage(content="You are a clinical evidence analyst. Return only valid JSON."),
                HumanMessage(content=prompt_text),
            ])
            raw = response.content

        result = json.loads(_strip_json(raw))
        state["contradictions"] = result.get("contradictions", [])
        state.setdefault("report", {})["consistency_note"] = result.get("consistency_note", "")
        state.setdefault("report", {})["contradiction_model"] = "meditron" if used_meditron else "claude"

    except Exception as e:
        print(f"Contradiction agent error: {e}")
        state["contradictions"] = []

    state["agent_status"]["contradiction"] = "complete"
    return state


# ─── Agent 4b: Drug Interaction Agent ───────────────────────────────────────

# Known high-risk drug interaction pairs for rule-based fast path
_KNOWN_INTERACTIONS = [
    ({"warfarin"}, {"nsaid", "ibuprofen", "naproxen", "aspirin", "celecoxib"},
     "major", "NSAIDs + warfarin significantly increase bleeding risk."),
    ({"warfarin"}, {"amiodarone"}, "major",
     "Amiodarone inhibits warfarin metabolism, potentiating anticoagulation."),
    ({"metformin"}, {"contrast", "iodinated contrast"},
     "major", "IV contrast with metformin risks contrast-induced nephropathy and lactic acidosis — hold metformin 48h."),
    ({"ssri", "sertraline", "fluoxetine", "escitalopram", "paroxetine", "citalopram"},
     {"maoi", "selegiline", "phenelzine", "tranylcypromine"},
     "major", "SSRI + MAOI combination is contraindicated — risk of serotonin syndrome."),
    ({"lithium"}, {"nsaid", "ibuprofen", "naproxen", "diclofenac"},
     "major", "NSAIDs reduce renal lithium clearance, causing toxicity."),
    ({"ace inhibitor", "lisinopril", "enalapril", "ramipril", "benazepril"},
     {"arb", "losartan", "valsartan", "irbesartan", "candesartan"},
     "moderate", "Dual RAAS blockade (ACE inhibitor + ARB) increases hyperkalemia and AKI risk."),
    ({"statin", "simvastatin", "atorvastatin", "rosuvastatin"},
     {"amiodarone", "clarithromycin", "erythromycin"},
     "moderate", "CYP3A4 inhibitors increase statin plasma levels, raising myopathy risk."),
    ({"qt prolonging", "amiodarone", "sotalol", "haloperidol", "methadone", "azithromycin"},
     {"qt prolonging", "amiodarone", "sotalol", "haloperidol", "methadone", "azithromycin"},
     "major", "Multiple QT-prolonging agents increase risk of torsades de pointes."),
    ({"sglt2 inhibitor", "dapagliflozin", "empagliflozin", "canagliflozin"},
     {"loop diuretic", "furosemide", "bumetanide", "torsemide"},
     "moderate", "SGLT2 inhibitor + loop diuretic combination increases dehydration and hypotension risk."),
    ({"clopidogrel"}, {"ppi", "omeprazole", "esomeprazole"},
     "moderate", "Omeprazole/esomeprazole reduce clopidogrel antiplatelet effect via CYP2C19 inhibition."),
]


def _check_rule_based(current_meds: list[str], recommendations_text: str) -> list[dict]:
    """Fast rule-based check against known interaction pairs."""
    current_lower = {m.lower() for m in current_meds}
    rec_lower = recommendations_text.lower()
    found = []

    for current_set, rec_set, severity, explanation in _KNOWN_INTERACTIONS:
        current_match = any(
            any(k in med for k in current_set) for med in current_lower
        )
        rec_match = any(k in rec_lower for k in rec_set)
        if current_match and rec_match:
            found.append({
                "type": "drug_interaction",
                "severity": severity,
                "description": explanation,
                "current_meds": [m for m in current_lower if any(k in m for k in current_set)],
            })
    return found


async def drug_interaction_agent(state: ClinicalState) -> ClinicalState:
    """
    Checks whether any evidence-based recommendations conflict with the
    patient's current medication list. Appends warnings to state['report'].
    Skips gracefully if no patient context is loaded.
    """
    state["agent_status"]["drug_interaction"] = "running"

    fhir_ctx = state.get("fhir_context")
    if not fhir_ctx or not fhir_ctx.get("medications"):
        # No patient loaded — nothing to check
        state.setdefault("report", {})["drug_interactions"] = []
        state["agent_status"]["drug_interaction"] = "complete"
        return state

    current_meds = fhir_ctx["medications"]
    summaries_text = " ".join(
        f"{s.get('intervention', '')} {s.get('key_outcomes', '')}"
        for s in state.get("summaries", [])
    )

    # 1. Fast rule-based check
    rule_hits = _check_rule_based(current_meds, summaries_text)

    # 2. LLM-based check (uses Claude for nuanced interaction detection)
    llm_hits: list[dict] = []
    if current_meds and summaries_text.strip():
        prompt = f"""You are a clinical pharmacist checking drug interactions.

Patient's current medications:
{chr(10).join(f"- {m}" for m in current_meds[:10])}

The following clinical interventions are being considered based on evidence:
{summaries_text[:1200]}

Identify any significant drug-drug interactions between the patient's current medications and the interventions above.
Return ONLY valid JSON in this exact format:
{{
  "interactions": [
    {{
      "severity": "major|moderate|minor",
      "current_drug": "name of patient's drug",
      "new_drug": "name of potentially interacting drug from recommendations",
      "mechanism": "brief pharmacological explanation",
      "clinical_significance": "what this means clinically and what to do"
    }}
  ]
}}
If no significant interactions found, return: {{"interactions": []}}"""

        try:
            llm = get_llm(max_tokens=800)
            resp = await asyncio.wait_for(
                llm.ainvoke([
                    SystemMessage(content="You are a clinical pharmacist. Return only valid JSON."),
                    HumanMessage(content=prompt),
                ]),
                timeout=25.0,
            )
            parsed = json.loads(_strip_json(resp.content))
            llm_hits = [
                {
                    "type": "drug_interaction",
                    "severity": h.get("severity", "moderate"),
                    "description": f"{h.get('current_drug', '?')} ↔ {h.get('new_drug', '?')}: {h.get('clinical_significance', h.get('mechanism', ''))}",
                    "current_meds": [h.get("current_drug", "")],
                }
                for h in parsed.get("interactions", [])
                if h.get("severity") in ("major", "moderate")
            ]
        except Exception as e:
            print(f"Drug interaction LLM check failed: {e}")

    # Merge and deduplicate
    all_interactions = rule_hits + [h for h in llm_hits if h not in rule_hits]
    state.setdefault("report", {})["drug_interactions"] = all_interactions

    if all_interactions:
        print(f"Drug interaction agent: found {len(all_interactions)} interaction(s)")

    state["agent_status"]["drug_interaction"] = "complete"
    return state


# ─── Agent 4: Synthesize Agent ────────────────────────────────────────────────

REPORT_SYSTEM = """You are a senior clinical evidence specialist writing a structured
clinical evidence report for healthcare professionals. Return ONLY valid JSON, no markdown.

The sources provided are numbered starting at 1. For each recommendation you MUST cite
which source numbers support it using the "source_refs" field (array of integers).
Be specific — only cite sources that directly support that recommendation.

JSON schema:
{
  "background": "2-3 sentence clinical context",
  "key_interventions": [
    {"name": "...", "evidence_level": "1A/1B/2A/etc", "summary": "one sentence", "source_refs": [1, 2]}
  ],
  "evidence_summary": "3-4 paragraph synthesis (separate paragraphs with \\n\\n)",
  "recommendations": [
    {
      "rank": 1,
      "recommendation": "...",
      "rationale": "...",
      "evidence_level": "...",
      "source_refs": [1, 3]
    }
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

    # Patient context block for synthesis
    patient_block = ""
    fhir_ctx = state.get("fhir_context")
    if fhir_ctx:
        lines = [f"\nPatient: {fhir_ctx['name']} ({fhir_ctx.get('mrn', '')})"]
        if fhir_ctx.get("conditions"):
            lines.append("  Conditions: " + "; ".join(fhir_ctx["conditions"][:6]))
        if fhir_ctx.get("medications"):
            lines.append("  Medications: " + "; ".join(fhir_ctx["medications"][:6]))
        if fhir_ctx.get("labs"):
            lines.append("  Latest labs: " + "; ".join(fhir_ctx["labs"][:4]))
        if fhir_ctx.get("lab_trends"):
            lines.append("  Lab trajectories (key trends to reason about):")
            for trend in fhir_ctx["lab_trends"][:4]:
                lines.append(f"    • {trend}")
        if fhir_ctx.get("allergies"):
            lines.append("  Allergies: " + "; ".join(fhir_ctx["allergies"]))
        lines.append(
            "  NOTE: Use lab trajectories to identify disease progression. "
            "Tailor recommendations to this patient's comorbidities, medications, and trends. "
            "Flag contraindications explicitly. Reference specific lab values and their direction."
        )
        patient_block = "\n".join(lines)

    # Session continuity block
    session_block = ""
    session_history = state.get("session_history") or []
    if session_history:
        prev_lines = []
        for entry in session_history[-3:]:
            prev_lines.append(f"  Q: {entry['question']}\n  A: {entry['answer']}")
        session_block = (
            "\n\nSession context (prior questions in this clinical session — "
            "build on these findings, don't repeat covered ground, and note any evolution):\n"
            + "\n".join(prev_lines)
        )

    prompt = f"""Clinical Question: {state['question']}
{pico_block}{patient_block}{session_block}
Evidence from {len(state['summaries'])} sources ({sum(1 for s in state['summaries'] if s.get('is_trial'))} trials, {sum(1 for s in state['summaries'] if not s.get('is_trial'))} published papers):
{summaries_text}{contradictions_text}

Generate a comprehensive structured clinical evidence report."""

    llm = get_llm(max_tokens=8192)

    # Retry up to 3 times with exponential backoff — handles transient API rate
    # limits and occasional malformed JSON responses from the model.
    report = None
    last_error = None
    for attempt in range(3):
        try:
            if attempt > 0:
                await asyncio.sleep(4 ** attempt)   # 4s, 16s
            response = await llm.ainvoke([
                SystemMessage(content=REPORT_SYSTEM),
                HumanMessage(content=prompt),
            ])
            raw = _strip_json(response.content)
            # If JSON is truncated, try to close it before parsing
            try:
                report = json.loads(raw)
            except json.JSONDecodeError:
                import re
                raw = re.sub(r',\s*$', '', raw.rstrip())
                if not raw.endswith('}'):
                    raw += '}'
                report = json.loads(raw)
            # Merge consistency note if set by contradiction agent
            if state.get("report", {}).get("consistency_note"):
                report["consistency_note"] = state["report"]["consistency_note"]
            break   # success — exit retry loop
        except Exception as e:
            last_error = e
            print(f"Synthesize error (attempt {attempt + 1}/3): {e}")

    if report is None:
        print(f"Synthesize failed after 3 attempts: {last_error}")
        report = {
            "background": f"Clinical synthesis for: {state['question']}",
            "key_interventions": [],
            "evidence_summary": "Report generation encountered an error. Please review individual paper summaries.",
            "recommendations": [],
            "clinical_bottom_line": "Manual review of evidence recommended.",
            "limitations": "Automated synthesis unavailable.",
            "grade_assessment": "Unable to assess",
        }

    # Annotate each recommendation with a confidence score before persisting.
    if report.get("recommendations"):
        report["recommendations"] = _compute_confidence(
            report["recommendations"],
            state.get("summaries") or [],
            state.get("contradictions") or [],
        )

    # Build a sources_index so the frontend can resolve [1], [2] citation refs
    # back to real paper metadata without any extra lookups.
    sources_index: dict[str, dict] = {}
    for i, s in enumerate(state["summaries"], 1):
        sources_index[str(i)] = {
            "pmid":    s.get("pmid", ""),
            "title":   s.get("title", ""),
            "journal": s.get("journal", ""),
            "year":    s.get("year", ""),
            "url":     s.get("url", ""),
            "source":  s.get("source", "PubMed"),
        }
    report["sources_index"] = sources_index

    state["report"] = report
    state["agent_status"]["synthesize"] = "complete"
    return state


# ─── Agent 5: Follow-up Agent ─────────────────────────────────────────────────

FOLLOWUP_SYSTEM = """You are a clinical reasoning assistant. Given a completed evidence
report, identify the 3 most clinically valuable follow-up questions a clinician should
explore next. Focus on gaps in the evidence, unresolved contradictions, patient-specific
considerations, and the next logical step in clinical reasoning.

Return ONLY a JSON array of exactly 3 strings. Each string is a complete, specific,
searchable clinical question. No markdown, no keys, just the array.

Example: ["What is the evidence for X in patients with Y?", "How does Z compare to W for ...", "What are the long-term outcomes of ..."]
"""


async def followup_agent(state: ClinicalState) -> ClinicalState:
    """
    Generates 3 follow-up questions grounded in the evidence gaps, contradictions,
    and limitations identified during synthesis.  Uses Haiku — fast and cheap since
    this runs after the main report is already streamed to the frontend.
    """
    report = state.get("report") or {}
    if not report.get("recommendations"):
        # Nothing to reason from — skip silently
        return state

    pico = state.get("pico") or {}
    limitations  = report.get("limitations", "")
    grade        = report.get("grade_assessment", "")
    contradictions = state.get("contradictions") or []
    conflict_text = ""
    if contradictions:
        conflict_text = "Unresolved conflicts:\n" + "\n".join(
            f"  - {c['conflict']}" for c in contradictions[:3]
        )

    prompt = f"""Original question: {state['question']}

PICO: {pico.get('population', '')} / {pico.get('intervention', '')} / {pico.get('comparison', '')} / {pico.get('outcome', '')}

Evidence grade: {grade}
Limitations: {limitations}
{conflict_text}

Top recommendations (for context):
{chr(10).join(f"  {i+1}. {r['recommendation']}" for i, r in enumerate(report.get('recommendations', [])[:3]))}

Generate 3 follow-up questions."""

    try:
        llm = get_llm(max_tokens=400)
        response = await llm.ainvoke([
            SystemMessage(content=FOLLOWUP_SYSTEM),
            HumanMessage(content=prompt),
        ])
        questions = json.loads(_strip_json(response.content))
        if isinstance(questions, list):
            report["followup_questions"] = [q for q in questions if isinstance(q, str)][:3]
            state["report"] = report
    except Exception as e:
        # Non-fatal — the main report is already complete
        print(f"Follow-up agent error: {e}")

    return state


def route_after_synthesize(state: ClinicalState) -> str:
    return END if state.get("error") else "followup"


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
    return END if state.get("error") else "drug_interaction"

def route_after_drug_interaction(state: ClinicalState) -> str:
    return END if state.get("error") else "synthesize"


# ─── Build Graph ─────────────────────────────────────────────────────────────

def build_graph():
    graph = StateGraph(ClinicalState)

    graph.add_node("fhir",             fhir_context_agent)
    graph.add_node("pico_extract",     pico_agent)
    graph.add_node("search",           search_agent)
    graph.add_node("summarizer",       summarizer_agent)
    graph.add_node("contradiction",    contradiction_agent)
    graph.add_node("drug_interaction", drug_interaction_agent)
    graph.add_node("synthesize",       synthesize_agent)
    graph.add_node("followup",         followup_agent)

    graph.set_entry_point("fhir")

    graph.add_conditional_edges("fhir",             route_after_fhir,             {"pico_extract": "pico_extract", END: END})
    graph.add_conditional_edges("pico_extract",     route_after_pico,             {"search": "search", END: END})
    graph.add_conditional_edges("search",            route_after_search,           {"summarizer": "summarizer", END: END})
    graph.add_conditional_edges("summarizer",        route_after_summarizer,       {"contradiction": "contradiction", END: END})
    graph.add_conditional_edges("contradiction",     route_after_contradiction,    {"drug_interaction": "drug_interaction", END: END})
    graph.add_conditional_edges("drug_interaction",  route_after_drug_interaction, {"synthesize": "synthesize", END: END})
    graph.add_conditional_edges("synthesize",        route_after_synthesize,       {"followup": "followup", END: END})
    graph.add_edge("followup", END)

    return graph.compile()


clinical_graph = build_graph()


# ─── Discharge Risk Agent ─────────────────────────────────────────────────────
# Standalone — NOT part of the evidence synthesis graph.
# Called directly by the discharge API endpoints / Celery beat task.

class DischargeRiskState(TypedDict):
    enrollment_id: str
    fhir_patient_id: str
    discharge_date: str          # ISO date string
    primary_diagnosis: str
    discharge_meds: list[dict]   # [{name, dose, frequency}]
    fhir_context: Optional[dict] # populated by fhir_context_agent logic
    risk_score: Optional[float]
    risk_tier: Optional[str]
    risk_flags: Optional[list]
    recommended_actions: Optional[list]
    agent_reasoning: Optional[str]
    error: Optional[str]


async def discharge_risk_agent(
    enrollment_id: str,
    fhir_patient_id: str,
    discharge_date: str,
    primary_diagnosis: str,
    discharge_meds: list[dict],
    fhir_context: Optional[dict] = None,
) -> dict:
    """
    Runs a 30-day readmission risk assessment for a discharged patient.
    Returns a dict matching DailyRiskScore fields.

    Designed to be called from:
      - POST /discharge/enroll (immediate first assessment)
      - A Celery beat task running nightly for all active enrollments
    """
    llm = get_llm(max_tokens=2048)

    fhir_summary = ""
    if fhir_context:
        conditions = [e.get("display", "") for e in fhir_context.get("entities", []) if e.get("entity_type") == "condition"]
        labs       = [f"{e.get('display','')} {e.get('value','')}" for e in fhir_context.get("entities", []) if e.get("entity_type") == "lab"]
        meds       = [e.get("display", "") for e in fhir_context.get("entities", []) if e.get("entity_type") == "medication"]
        fhir_summary = f"""
Active conditions: {', '.join(conditions[:8]) or 'none recorded'}
Current medications: {', '.join(meds[:10]) or 'none recorded'}
Recent labs: {', '.join(labs[:8]) or 'none recorded'}
""".strip()

    med_list = ", ".join(m.get("name", "") for m in discharge_meds) if discharge_meds else "not recorded"

    prompt = f"""You are a clinical risk stratification AI. Assess 30-day hospital readmission risk for this patient.

DISCHARGE INFORMATION
Primary diagnosis: {primary_diagnosis}
Discharge date: {discharge_date}
Medications at discharge: {med_list}

CURRENT FHIR CONTEXT
{fhir_summary or 'No FHIR data available'}

OUTPUT — respond with valid JSON only, no prose:
{{
  "risk_score": <float 0.0–1.0>,
  "risk_tier": "<high|medium|low>",
  "risk_flags": [
    {{"flag": "<clinical flag>", "severity": "<high|medium|low>", "detail": "<1-sentence explanation>"}}
  ],
  "recommended_actions": [
    {{"action": "<specific action>", "urgency": "<immediate|within_48h|within_week>"}}
  ],
  "reasoning": "<2-3 sentence clinical rationale for risk tier>"
}}

Risk tier thresholds: high = score ≥ 0.65, medium = 0.35–0.64, low < 0.35.
Focus on: medication adherence risk, follow-up appointment gaps, abnormal labs, social determinants, diagnosis-specific 30-day risk factors (e.g. HF, COPD, sepsis, ACS)."""

    try:
        response = await llm.ainvoke([
            SystemMessage(content="You are a clinical AI. Respond with valid JSON only."),
            HumanMessage(content=prompt),
        ])
        raw = _strip_json(response.content)
        data = json.loads(raw)

        score = float(data.get("risk_score", 0.5))
        # Enforce tier consistency with score
        if score >= 0.65:
            tier = "high"
        elif score >= 0.35:
            tier = "medium"
        else:
            tier = "low"

        return {
            "risk_score":          score,
            "risk_tier":           tier,
            "risk_flags":          data.get("risk_flags", []),
            "recommended_actions": data.get("recommended_actions", []),
            "agent_reasoning":     data.get("reasoning", ""),
        }

    except Exception as e:
        return {
            "risk_score":          0.5,
            "risk_tier":           "medium",
            "risk_flags":          [{"flag": "Assessment unavailable", "severity": "low", "detail": str(e)}],
            "recommended_actions": [{"action": "Manual clinical review required", "urgency": "within_48h"}],
            "agent_reasoning":     f"Risk agent error: {e}",
        }
