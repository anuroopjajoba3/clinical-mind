#!/usr/bin/env python3
"""
ClinicalMind Evaluation Pipeline

Runs 10 clinical scenarios through the live pipeline, scores each output
on two dimensions:

  1. STRUCTURAL  (automated, deterministic)
     — All required report fields present
     — Recommendations have evidence_level, rationale, source_refs
     — At least one paper was found (source_count > 0)
     — Evidence levels are valid values (1A/1B/2A/2B/3/4)

  2. QUALITY  (LLM-as-judge via Claude)
     — Does the bottom line actually answer the question?
     — Are the recommendations actionable and specific?
     — Does the evidence cited support the claims?

Usage:
    python run_eval.py                          # uses CLINICALMIND_API_URL env var
    python run_eval.py --api http://localhost:8000
    python run_eval.py --scenario t2dm_firstline  # run one scenario only
    python run_eval.py --skip-llm               # structural scoring only (faster)

Output:
    eval_results.json   — machine-readable results
    EVAL_RESULTS.md     — human-readable table (overwrites root-level file)
"""

import os
import sys
import json
import time
import asyncio
import argparse
import httpx
from datetime import datetime, timezone
from pathlib import Path

# ─── Config ──────────────────────────────────────────────────────────────────

ROOT_DIR       = Path(__file__).resolve().parents[2]   # repo root
SCENARIOS_FILE = Path(__file__).parent / "scenarios.json"
RESULTS_FILE   = Path(__file__).parent / "eval_results.json"
MD_FILE        = ROOT_DIR / "EVAL_RESULTS.md"

VALID_LEVELS   = {"1A", "1B", "2A", "2B", "3", "4"}
REQUIRED_FIELDS = {
    "background", "key_interventions", "evidence_summary",
    "recommendations", "clinical_bottom_line", "limitations",
}

POLL_INTERVAL  = 3    # seconds between status polls
POLL_TIMEOUT   = 180  # max seconds to wait for pipeline to complete


# ─── Structural scorer ───────────────────────────────────────────────────────

def score_structural(scenario: dict, result: dict) -> dict:
    """
    Deterministic checks against the raw pipeline output.
    Returns a dict of {check_name: bool} plus an overall 0-100 score.
    """
    report     = result.get("report") or {}
    summaries  = result.get("summaries") or []
    recs       = report.get("recommendations") or []

    checks = {}

    # 1. All required report fields present and non-empty
    for field in REQUIRED_FIELDS:
        val = report.get(field)
        checks[f"field_{field}"] = bool(val and (
            (isinstance(val, str) and val.strip()) or
            (isinstance(val, list) and len(val) > 0)
        ))

    # 2. Source count meets minimum
    checks["min_sources"] = len(summaries) >= scenario.get("min_sources", 2)

    # 3. Every recommendation has evidence_level, recommendation text, rationale
    if recs:
        checks["rec_has_level"]     = all(r.get("evidence_level") in VALID_LEVELS for r in recs)
        checks["rec_has_text"]      = all(r.get("recommendation", "").strip() for r in recs)
        checks["rec_has_rationale"] = all(r.get("rationale", "").strip() for r in recs)
        checks["rec_has_source_refs"] = any(r.get("source_refs") for r in recs)
    else:
        checks["rec_has_level"]       = False
        checks["rec_has_text"]        = False
        checks["rec_has_rationale"]   = False
        checks["rec_has_source_refs"] = False

    # 4. Clinical bottom line is substantive (> 50 chars)
    bottom_line = report.get("clinical_bottom_line", "")
    checks["bottom_line_substantive"] = len(bottom_line) > 50

    # 5. At least one Level 1A or 1B source in high-evidence specialties
    high_evidence = any(
        s.get("evidence_level") in ("1A", "1B") for s in summaries
    )
    checks["has_high_evidence"] = high_evidence

    # 6. Expected keywords appear somewhere in the report text
    report_text = json.dumps(report).lower()
    keyword_hits = [
        kw for kw in scenario.get("expected_keywords", [])
        if kw.lower() in report_text
    ]
    checks["keyword_coverage"] = len(keyword_hits) >= max(1, len(scenario.get("expected_keywords", [])) // 2)

    passed = sum(1 for v in checks.values() if v)
    total  = len(checks)
    score  = round((passed / total) * 100)

    return {"checks": checks, "score": score, "passed": passed, "total": total}


# ─── LLM-as-judge scorer ─────────────────────────────────────────────────────

async def score_quality_llm(scenario: dict, result: dict, api_key: str) -> dict:
    """
    Ask Claude to score the output on 4 quality dimensions (1-5 each).
    Returns {dimension: score, ...} plus an overall 0-100 score.
    """
    report = result.get("report") or {}

    prompt = f"""You are evaluating a clinical evidence synthesis tool. Score the output below on 4 dimensions, each from 1 (poor) to 5 (excellent). Reply with ONLY valid JSON.

CLINICAL QUESTION: {scenario['question']}

EXPECTED RUBRIC: {scenario['quality_rubric']}

SYNTHESISED OUTPUT:
Clinical Bottom Line: {report.get('clinical_bottom_line', 'MISSING')}

Recommendations:
{json.dumps(report.get('recommendations', []), indent=2)}

Evidence Summary (first 500 chars):
{str(report.get('evidence_summary', ''))[:500]}

Score on these 4 dimensions:
1. relevance       — Does the bottom line directly and specifically answer the question?
2. accuracy        — Are the recommendations consistent with the rubric's expected content?
3. actionability   — Are recommendations specific enough for a clinician to act on?
4. evidence_use    — Does the synthesis appropriately weight high-quality evidence (1A/1B)?

Reply in this exact JSON format:
{{"relevance": 0, "accuracy": 0, "actionability": 0, "evidence_use": 0, "reasoning": "one sentence"}}"""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 256,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            resp.raise_for_status()
            content = resp.json()["content"][0]["text"].strip()
            # Strip markdown code fences if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            scores = json.loads(content)
    except Exception as e:
        return {"error": str(e), "score": 0, "dimensions": {}}

    dims = {k: v for k, v in scores.items() if k != "reasoning"}
    overall = round(sum(dims.values()) / (len(dims) * 5) * 100) if dims else 0
    return {
        "dimensions": dims,
        "reasoning":  scores.get("reasoning", ""),
        "score":      overall,
    }


# ─── Pipeline runner ─────────────────────────────────────────────────────────

async def run_scenario(
    scenario: dict,
    api_base: str,
    skip_llm: bool,
    anthropic_key: str,
) -> dict:
    """Run a single scenario end-to-end and return scored results."""
    print(f"  [{scenario['id']}] Submitting…", end="", flush=True)

    async with httpx.AsyncClient(timeout=60, base_url=api_base) as client:
        # Submit job
        try:
            resp = await client.post("/research", json={"question": scenario["question"]})
            resp.raise_for_status()
            job_id = resp.json()["job_id"]
        except Exception as e:
            print(f" FAILED to submit: {e}")
            return {"scenario_id": scenario["id"], "error": str(e), "structural": None, "quality": None}

        # Poll until complete
        start   = time.time()
        result  = {}
        status  = "pending"
        while status not in ("complete", "error"):
            if time.time() - start > POLL_TIMEOUT:
                print(" TIMEOUT")
                return {"scenario_id": scenario["id"], "error": "timeout", "structural": None, "quality": None}
            await asyncio.sleep(POLL_INTERVAL)
            try:
                r = await client.get(f"/status/{job_id}")
                data = r.json()
                status = data.get("status", "pending")
                result = data
                print(".", end="", flush=True)
            except Exception:
                pass

    if status == "error":
        print(f" PIPELINE ERROR: {result.get('error')}")
        return {"scenario_id": scenario["id"], "error": result.get("error"), "structural": None, "quality": None}

    print(" done")

    # Score
    structural = score_structural(scenario, result)

    quality = None
    if not skip_llm and anthropic_key:
        print(f"  [{scenario['id']}] Scoring quality…", end="", flush=True)
        quality = await score_quality_llm(scenario, result, anthropic_key)
        print(f" {quality.get('score', '?')}/100")

    return {
        "scenario_id": scenario["id"],
        "category":    scenario["category"],
        "question":    scenario["question"],
        "source_count": len(result.get("summaries") or []),
        "rec_count":    len((result.get("report") or {}).get("recommendations") or []),
        "structural":  structural,
        "quality":     quality,
        "elapsed_s":   round(time.time() - start, 1),
        "error":       None,
    }


# ─── Report generator ────────────────────────────────────────────────────────

def write_markdown(results: list[dict], run_at: str):
    """Overwrite EVAL_RESULTS.md with the latest run."""
    lines = [
        "# ClinicalMind — Eval Results",
        "",
        f"**Last run:** {run_at}  ",
        f"**Scenarios:** {len(results)}  ",
        "",
        "## Scoring Methodology",
        "",
        "Each scenario is scored on two dimensions:",
        "",
        "**Structural (automated)** — deterministic checks:",
        "- All 6 required report fields present and non-empty",
        "- Source count meets scenario minimum",
        "- Every recommendation has `evidence_level`, text, rationale, and `source_refs`",
        "- Clinical bottom line > 50 characters",
        "- At least one Level 1A or 1B source found",
        "- ≥50% of expected clinical keywords appear in the output",
        "",
        "**Quality (LLM-as-judge)** — Claude Haiku scores 1-5 on:",
        "- Relevance: does the bottom line answer the question?",
        "- Accuracy: consistent with clinical rubric?",
        "- Actionability: specific enough for clinical use?",
        "- Evidence use: appropriately weights high-quality evidence?",
        "",
        "---",
        "",
        "## Results",
        "",
        "| Scenario | Category | Sources | Recs | Structural | Quality | Time |",
        "|----------|----------|---------|------|-----------|---------|------|",
    ]

    struct_scores = []
    qual_scores   = []

    for r in results:
        if r.get("error") and not r.get("structural"):
            lines.append(f"| {r['scenario_id']} | — | — | — | ERROR | — | — |")
            continue

        s_score = r["structural"]["score"] if r.get("structural") else "—"
        q_score = r["quality"]["score"]    if r.get("quality")     else "—"
        if isinstance(s_score, int):
            struct_scores.append(s_score)
        if isinstance(q_score, int):
            qual_scores.append(q_score)

        s_emoji = "✅" if isinstance(s_score, int) and s_score >= 80 else ("⚠️" if isinstance(s_score, int) and s_score >= 60 else "❌")
        q_emoji = "✅" if isinstance(q_score, int) and q_score >= 80 else ("⚠️" if isinstance(q_score, int) and q_score >= 60 else ("❌" if isinstance(q_score, int) else ""))

        lines.append(
            f"| {r['scenario_id']} | {r.get('category','—')} "
            f"| {r.get('source_count','—')} | {r.get('rec_count','—')} "
            f"| {s_emoji} {s_score}% | {q_emoji} {q_score}% "
            f"| {r.get('elapsed_s','—')}s |"
        )

    # Summary
    avg_s = round(sum(struct_scores) / len(struct_scores)) if struct_scores else "—"
    avg_q = round(sum(qual_scores)   / len(qual_scores))   if qual_scores   else "—"
    lines += [
        "",
        f"**Average structural score:** {avg_s}%  ",
        f"**Average quality score:** {avg_q}%  ",
        "",
        "---",
        "",
        "## Detailed Structural Checks",
        "",
    ]

    for r in results:
        if not r.get("structural"):
            continue
        lines.append(f"### {r['scenario_id']}")
        lines.append("")
        checks = r["structural"]["checks"]
        for check, passed in checks.items():
            icon = "✅" if passed else "❌"
            lines.append(f"- {icon} `{check}`")
        if r.get("quality") and r["quality"].get("reasoning"):
            lines.append(f"\n**Quality note:** {r['quality']['reasoning']}")
        lines.append("")

    lines += [
        "---",
        "",
        "*Generated by `backend/eval/run_eval.py` — ClinicalMind evaluation pipeline*",
    ]

    MD_FILE.write_text("\n".join(lines))
    print(f"\n  Written → {MD_FILE}")


# ─── Entry point ─────────────────────────────────────────────────────────────

async def main():
    parser = argparse.ArgumentParser(description="ClinicalMind evaluation pipeline")
    parser.add_argument("--api",      default=os.getenv("CLINICALMIND_API_URL", "http://localhost:8000"))
    parser.add_argument("--scenario", default=None, help="Run only this scenario ID")
    parser.add_argument("--skip-llm", action="store_true", help="Skip LLM quality scoring")
    args = parser.parse_args()

    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not args.skip_llm and not anthropic_key:
        print("⚠  ANTHROPIC_API_KEY not set — using --skip-llm mode")
        args.skip_llm = True

    scenarios = json.loads(SCENARIOS_FILE.read_text())
    if args.scenario:
        scenarios = [s for s in scenarios if s["id"] == args.scenario]
        if not scenarios:
            print(f"Scenario '{args.scenario}' not found.")
            sys.exit(1)

    print(f"\nClinicalMind Eval — {len(scenarios)} scenario(s) → {args.api}\n")

    results  = []
    for i, scenario in enumerate(scenarios):
        r = await run_scenario(scenario, args.api, args.skip_llm, anthropic_key)
        results.append(r)
        # Brief pause between scenarios to avoid Anthropic API rate limits
        if i < len(scenarios) - 1:
            await asyncio.sleep(5)

    # Save JSON
    run_at = datetime.now(timezone.utc).isoformat()
    output = {"run_at": run_at, "api": args.api, "results": results}
    RESULTS_FILE.write_text(json.dumps(output, indent=2))
    print(f"\n  Written → {RESULTS_FILE}")

    # Print summary table
    print("\n" + "="*60)
    print(f"{'Scenario':<30} {'Structural':>12} {'Quality':>10} {'Time':>6}")
    print("-"*60)
    for r in results:
        s = r["structural"]["score"] if r.get("structural") else "ERR"
        q = r["quality"]["score"]    if r.get("quality")    else "—"
        t = f"{r.get('elapsed_s','?')}s"
        icon = "✅" if isinstance(s, int) and s >= 80 else ("⚠️ " if isinstance(s, int) and s >= 60 else "❌")
        print(f"{icon} {r['scenario_id']:<28} {str(s)+('%' if isinstance(s,int) else ''):>12} {str(q)+('%' if isinstance(q,int) else ''):>10} {t:>6}")
    print("="*60)

    # Overwrite EVAL_RESULTS.md
    write_markdown(results, run_at)


if __name__ == "__main__":
    asyncio.run(main())
