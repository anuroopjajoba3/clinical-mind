"""
PDF export for ClinicalMind clinical reports.
Generates a formatted PDF using weasyprint + inline HTML/CSS.
"""
from __future__ import annotations
from datetime import datetime
import html


def _esc(text: str) -> str:
    return html.escape(str(text or ""))


def _evidence_color(level: str) -> str:
    return {
        "1A": "#059669", "1B": "#2563eb",
        "2A": "#d97706", "2B": "#ea580c",
        "3":  "#7c3aed", "4":  "#6b7280",
    }.get(level, "#6b7280")


def build_report_html(question: str, report: dict, summaries: list | None = None) -> str:
    """Render the clinical report as a self-contained HTML string."""

    recs_html = ""
    for i, r in enumerate((report.get("recommendations") or []), 1):
        color = _evidence_color(r.get("evidence_level", "4"))
        recs_html += f"""
        <div class="rec-row">
          <div class="rec-num" style="background:{color}20;color:{color}">{i}</div>
          <div class="rec-body">
            <p class="rec-text">{_esc(r.get("recommendation",""))}</p>
            {f'<p class="rec-rationale">{_esc(r.get("rationale",""))}</p>' if r.get("rationale") else ""}
          </div>
          <span class="badge" style="background:{color}20;color:{color};border:1px solid {color}40">
            {_esc(r.get("evidence_level",""))}
          </span>
        </div>"""

    interventions_html = ""
    for item in (report.get("key_interventions") or []):
        color = _evidence_color(item.get("evidence_level", "4"))
        interventions_html += f"""
        <div class="intervention-row">
          <span class="badge" style="background:{color}20;color:{color};border:1px solid {color}40">
            {_esc(item.get("evidence_level","?"))}
          </span>
          <div>
            <p class="int-name">{_esc(item.get("name",""))}</p>
            {f'<p class="int-summary">{_esc(item.get("summary",""))}</p>' if item.get("summary") else ""}
          </div>
        </div>"""

    evidence_rows = ""
    for s in (summaries or []):
        color = _evidence_color(s.get("evidence_level", "4"))
        evidence_rows += f"""
        <tr>
          <td><a href="{_esc(s.get('url','#'))}">{_esc(s.get('title',''))}</a>
              <br><small>{_esc(s.get('authors',''))} · {_esc(s.get('journal',''))} ({_esc(s.get('year',''))})</small></td>
          <td><span class="badge" style="background:{color}20;color:{color};border:1px solid {color}40">{_esc(s.get('evidence_level',''))}</span></td>
          <td>{_esc(s.get('intervention',''))}</td>
          <td>{_esc(s.get('sample_size',''))}</td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: Inter, system-ui, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.5; padding: 40px; }}
  .header {{ border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }}
  .header h1 {{ font-size: 22px; font-weight: 700; color: #1e293b; }}
  .header .brand {{ font-size: 11px; color: #64748b; }}
  .question-box {{ background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }}
  .question-box p {{ font-size: 13px; font-weight: 600; color: #1e40af; }}
  .bottom-line {{ background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; }}
  .bottom-line .label {{ font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #3b82f6; margin-bottom: 6px; }}
  .bottom-line p {{ font-size: 12px; font-weight: 600; color: #1e293b; }}
  h2 {{ font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin: 20px 0 10px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }}
  p {{ font-size: 11px; color: #475569; margin-bottom: 8px; }}
  .badge {{ font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 4px; white-space: nowrap; }}
  .rec-row {{ display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }}
  .rec-num {{ width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }}
  .rec-body {{ flex: 1; }}
  .rec-text {{ font-size: 11px; font-weight: 600; color: #1e293b; margin-bottom: 3px; }}
  .rec-rationale {{ font-size: 10px; color: #64748b; }}
  .intervention-row {{ display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; padding: 8px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }}
  .int-name {{ font-size: 11px; font-weight: 600; color: #1e293b; }}
  .int-summary {{ font-size: 10px; color: #64748b; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }}
  th {{ background: #f1f5f9; padding: 6px 8px; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }}
  td {{ padding: 6px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }}
  td a {{ color: #2563eb; text-decoration: none; font-weight: 500; }}
  .limitations {{ background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 10px 14px; }}
  .footer {{ margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }}
  .page-break {{ page-break-before: always; }}
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>🧬 Clinical Evidence Report</h1>
    <p style="color:#64748b;font-size:11px;margin-top:3px">AI-Powered Evidence Synthesis · ClinicalMind v2.0</p>
  </div>
  <div class="brand" style="text-align:right">
    Generated {datetime.now().strftime("%B %d, %Y %H:%M")}<br>
    <span style="color:#94a3b8">PubMed · ClinicalTrials.gov · FHIR R4</span>
  </div>
</div>

<div class="question-box">
  <p>Clinical Question: {_esc(question)}</p>
</div>

{f'''<div class="bottom-line">
  <div class="label">⚡ Clinical Bottom Line</div>
  <p>{_esc(report.get("clinical_bottom_line",""))}</p>
</div>''' if report.get("clinical_bottom_line") else ""}

{f'<h2>📖 Background</h2><p>{_esc(report.get("background",""))}</p>' if report.get("background") else ""}

{f'<h2>💊 Key Interventions</h2>{interventions_html}' if interventions_html else ""}

{'<h2>📊 Evidence Summary</h2>' + "".join(f'<p>{_esc(p)}</p>' for p in (report.get("evidence_summary") or "").split("\n") if p) if report.get("evidence_summary") else ""}

{f'<h2>✅ Recommendations</h2>{recs_html}' if recs_html else ""}

{f'''<div class="limitations">
  <div class="label" style="color:#b45309">⚠️ Limitations</div>
  <p style="color:#78350f">{_esc(report.get("limitations",""))}</p>
</div>''' if report.get("limitations") else ""}

{f'''<h2>📄 Evidence Base ({len(summaries)} papers)</h2>
<table>
  <thead><tr><th>Title / Authors</th><th>Level</th><th>Intervention</th><th>N</th></tr></thead>
  <tbody>{evidence_rows}</tbody>
</table>''' if evidence_rows else ""}

<div class="footer">
  <span>Generated by ClinicalMind · AI Clinical Evidence Synthesis · Not a substitute for clinical judgment</span>
  <span>{datetime.now().strftime("%Y-%m-%d")}</span>
</div>

</body>
</html>"""


def generate_pdf(question: str, report: dict, summaries: list | None = None) -> bytes:
    """Convert the report HTML to PDF bytes using weasyprint."""
    try:
        from weasyprint import HTML, CSS
        html_content = build_report_html(question, report, summaries)
        return HTML(string=html_content).write_pdf(
            stylesheets=[CSS(string="@page { size: A4; margin: 0; }")]
        )
    except ImportError:
        raise RuntimeError("weasyprint is not installed. Run: pip install weasyprint")
