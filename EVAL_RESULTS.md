# ClinicalMind — Eval Results

**Last run:** 2026-05-23T01:41:05.185188+00:00  
**Scenarios:** 10  

## Scoring Methodology

Each scenario is scored on two dimensions:

**Structural (automated)** — deterministic checks:
- All 6 required report fields present and non-empty
- Source count meets scenario minimum
- Every recommendation has `evidence_level`, text, rationale, and `source_refs`
- Clinical bottom line > 50 characters
- At least one Level 1A or 1B source found
- ≥50% of expected clinical keywords appear in the output

**Quality (LLM-as-judge)** — Claude Haiku scores 1-5 on:
- Relevance: does the bottom line answer the question?
- Accuracy: consistent with clinical rubric?
- Actionability: specific enough for clinical use?
- Evidence use: appropriately weights high-quality evidence?

---

## Results

| Scenario | Category | Sources | Recs | Structural | Quality | Time |
|----------|----------|---------|------|-----------|---------|------|
| t2dm_firstline | Diabetes | 8 | 3 | ✅ 100% |  —% | 37.6s |
| hfref_management | Cardiology | 8 | 4 | ✅ 100% |  —% | 43.3s |
| ckd_progression | Nephrology | 8 | 3 | ✅ 93% |  —% | 43.9s |
| hypertension_ckd | Nephrology | 8 | 3 | ✅ 100% |  —% | 36.5s |
| statin_primary_prevention | Cardiology | 7 | 0 | ❌ 50% |  —% | 40.0s |
| sglt2_heart_failure | Cardiology | 8 | 3 | ✅ 100% |  —% | 64.4s |
| glp1_obesity | Endocrinology | 8 | 3 | ✅ 93% |  —% | 64.2s |
| metformin_ckd_safety | Nephrology | 8 | 3 | ✅ 100% |  —% | 66.5s |
| ace_inhibitor_diabetic_nephropathy | Nephrology | 8 | 3 | ✅ 93% |  —% | 37.8s |
| aspirin_primary_prevention | Cardiology | 8 | 0 | ❌ 43% |  —% | 40.1s |

**Average structural score:** 87%  
**Average quality score:** —%  

---

## Detailed Structural Checks

### t2dm_firstline

- ✅ `field_evidence_summary`
- ✅ `field_clinical_bottom_line`
- ✅ `field_limitations`
- ✅ `field_background`
- ✅ `field_key_interventions`
- ✅ `field_recommendations`
- ✅ `min_sources`
- ✅ `rec_has_level`
- ✅ `rec_has_text`
- ✅ `rec_has_rationale`
- ✅ `rec_has_source_refs`
- ✅ `bottom_line_substantive`
- ✅ `has_high_evidence`
- ✅ `keyword_coverage`

### hfref_management

- ✅ `field_evidence_summary`
- ✅ `field_clinical_bottom_line`
- ✅ `field_limitations`
- ✅ `field_background`
- ✅ `field_key_interventions`
- ✅ `field_recommendations`
- ✅ `min_sources`
- ✅ `rec_has_level`
- ✅ `rec_has_text`
- ✅ `rec_has_rationale`
- ✅ `rec_has_source_refs`
- ✅ `bottom_line_substantive`
- ✅ `has_high_evidence`
- ✅ `keyword_coverage`

### ckd_progression

- ✅ `field_evidence_summary`
- ✅ `field_clinical_bottom_line`
- ✅ `field_limitations`
- ✅ `field_background`
- ✅ `field_key_interventions`
- ✅ `field_recommendations`
- ✅ `min_sources`
- ✅ `rec_has_level`
- ✅ `rec_has_text`
- ✅ `rec_has_rationale`
- ✅ `rec_has_source_refs`
- ✅ `bottom_line_substantive`
- ✅ `has_high_evidence`
- ❌ `keyword_coverage`

### hypertension_ckd

- ✅ `field_evidence_summary`
- ✅ `field_clinical_bottom_line`
- ✅ `field_limitations`
- ✅ `field_background`
- ✅ `field_key_interventions`
- ✅ `field_recommendations`
- ✅ `min_sources`
- ✅ `rec_has_level`
- ✅ `rec_has_text`
- ✅ `rec_has_rationale`
- ✅ `rec_has_source_refs`
- ✅ `bottom_line_substantive`
- ✅ `has_high_evidence`
- ✅ `keyword_coverage`

### statin_primary_prevention

- ✅ `field_evidence_summary`
- ✅ `field_clinical_bottom_line`
- ✅ `field_limitations`
- ✅ `field_background`
- ❌ `field_key_interventions`
- ❌ `field_recommendations`
- ✅ `min_sources`
- ❌ `rec_has_level`
- ❌ `rec_has_text`
- ❌ `rec_has_rationale`
- ❌ `rec_has_source_refs`
- ❌ `bottom_line_substantive`
- ✅ `has_high_evidence`
- ✅ `keyword_coverage`

### sglt2_heart_failure

- ✅ `field_evidence_summary`
- ✅ `field_clinical_bottom_line`
- ✅ `field_limitations`
- ✅ `field_background`
- ✅ `field_key_interventions`
- ✅ `field_recommendations`
- ✅ `min_sources`
- ✅ `rec_has_level`
- ✅ `rec_has_text`
- ✅ `rec_has_rationale`
- ✅ `rec_has_source_refs`
- ✅ `bottom_line_substantive`
- ✅ `has_high_evidence`
- ✅ `keyword_coverage`

### glp1_obesity

- ✅ `field_evidence_summary`
- ✅ `field_clinical_bottom_line`
- ✅ `field_limitations`
- ✅ `field_background`
- ✅ `field_key_interventions`
- ✅ `field_recommendations`
- ✅ `min_sources`
- ✅ `rec_has_level`
- ✅ `rec_has_text`
- ✅ `rec_has_rationale`
- ✅ `rec_has_source_refs`
- ✅ `bottom_line_substantive`
- ✅ `has_high_evidence`
- ❌ `keyword_coverage`

### metformin_ckd_safety

- ✅ `field_evidence_summary`
- ✅ `field_clinical_bottom_line`
- ✅ `field_limitations`
- ✅ `field_background`
- ✅ `field_key_interventions`
- ✅ `field_recommendations`
- ✅ `min_sources`
- ✅ `rec_has_level`
- ✅ `rec_has_text`
- ✅ `rec_has_rationale`
- ✅ `rec_has_source_refs`
- ✅ `bottom_line_substantive`
- ✅ `has_high_evidence`
- ✅ `keyword_coverage`

### ace_inhibitor_diabetic_nephropathy

- ✅ `field_evidence_summary`
- ✅ `field_clinical_bottom_line`
- ✅ `field_limitations`
- ✅ `field_background`
- ✅ `field_key_interventions`
- ✅ `field_recommendations`
- ✅ `min_sources`
- ✅ `rec_has_level`
- ✅ `rec_has_text`
- ✅ `rec_has_rationale`
- ✅ `rec_has_source_refs`
- ✅ `bottom_line_substantive`
- ✅ `has_high_evidence`
- ❌ `keyword_coverage`

### aspirin_primary_prevention

- ✅ `field_evidence_summary`
- ✅ `field_clinical_bottom_line`
- ✅ `field_limitations`
- ✅ `field_background`
- ❌ `field_key_interventions`
- ❌ `field_recommendations`
- ✅ `min_sources`
- ❌ `rec_has_level`
- ❌ `rec_has_text`
- ❌ `rec_has_rationale`
- ❌ `rec_has_source_refs`
- ❌ `bottom_line_substantive`
- ✅ `has_high_evidence`
- ❌ `keyword_coverage`

---

*Generated by `backend/eval/run_eval.py` — ClinicalMind evaluation pipeline*