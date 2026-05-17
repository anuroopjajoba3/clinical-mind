# LinkedIn Post — ClinicalMind

---

🧬 I built an AI clinical decision support tool that queries PubMed, runs an evidence synthesis pipeline, and hands doctors a structured report — in under 30 seconds.

Here's what I built and why it matters:

---

**The problem:**
Physicians spend ~5 hours/week manually searching medical literature. That's 260 hours/year per doctor that could go toward patients.

**What ClinicalMind does:**
A clinician types a question like *"Is metformin safe in early-stage CKD?"* — and a multi-agent AI pipeline handles the rest:

🔍 PICO extraction — structures the clinical question into Population, Intervention, Comparison, Outcome  
📚 PubMed + ClinicalTrials.gov search — pulls recent RCTs, meta-analyses, systematic reviews  
⚖️ Evidence synthesis — grades each paper (1A → 4) and surfaces contradictions  
📄 Report generation — produces actionable recommendations with rationale  
🏥 FHIR R4 integration — loads real patient context (meds, labs, allergies) from Epic-compatible FHIR servers  

**Tech stack:**
- LangGraph multi-agent pipeline (7 nodes, typed state, conditional routing)
- FastAPI with SSE streaming so you watch each agent complete in real time
- PostgreSQL + Redis + Celery for async job queue
- React + Tailwind frontend
- SMART on FHIR for Epic App Orchard compatibility
- Prometheus metrics + rate limiting + CI/CD on GitHub Actions
- Deployed on Railway (backend) + Vercel (frontend)

**Why I built this:**
Healthcare is one of the few industries where AI can have a direct, measurable impact on human outcomes. I wanted to build something that shows I understand both the engineering complexity *and* the domain — not just a chatbot wrapper.

**What I'm looking for:**
I'm actively exploring roles at health tech companies working on clinical AI, FHIR interoperability, or AI-powered workflows. If you're building in this space — or know someone who is — I'd love to connect.

GitHub: [link]  
Demo: [link]

---

*#HealthTech #ClinicalAI #FHIR #LangGraph #FastAPI #AIinHealthcare #OpenToWork*

---

## Shorter version (if character limit is tight)

🧬 Built ClinicalMind — an AI evidence synthesis tool for clinicians.

Type a clinical question → 7-agent LangGraph pipeline queries PubMed + ClinicalTrials.gov → structured report with evidence grades in <30 seconds.

Stack: LangGraph · FastAPI · FHIR R4 · React · Railway/Vercel

The FHIR integration lets it load real patient context from Epic-compatible servers — so recommendations are personalized, not generic.

Looking for roles in health tech / clinical AI. Open to connect!

GitHub: [link] | Demo: [link]

#HealthTech #ClinicalAI #FHIR #OpenToWork
