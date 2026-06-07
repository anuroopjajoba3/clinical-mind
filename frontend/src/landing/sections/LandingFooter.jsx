const NAV_LINKS = [
  { label: 'Pipeline',  href: '#features' },
  { label: 'Evidence',  href: '#evidence' },
  { label: 'Workflow',  href: '#workflow' },
  { label: 'Platform',  href: '#platform' },
  { label: 'Early Access', href: '#cta' },
]

export default function LandingFooter() {
  return (
    <footer className="bg-[#F8FAFC] border-t border-slate-200 px-6 md:px-14 py-10">
      <div className="max-w-[1100px] mx-auto">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#0891B2] flex items-center justify-center flex-shrink-0">
              <span className="font-sans text-[10px] font-extrabold text-white">CM</span>
            </div>
            <div>
              <span className="font-sans text-[14px] font-bold text-slate-900">ClinicalMind</span>
              <p className="font-sans text-[11px] text-slate-400 mt-0.5">AI clinical evidence synthesis · FHIR-native</p>
            </div>
          </div>

          {/* Section links */}
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="font-sans text-[13px] text-slate-500 hover:text-slate-800 transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <a href="/app"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0891B2] hover:bg-[#0E7490] text-white font-sans text-[13px] font-semibold rounded-lg transition-colors shadow-sm flex-shrink-0">
            Open platform
          </a>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <span className="font-sans text-[12px] text-slate-400">
            © {new Date().getFullYear()} ClinicalMind · For research use only
          </span>
          <div className="flex items-center gap-5">
            {['HIPAA Ready', 'FHIR R4 Native', 'HL7 Compliant'].map(badge => (
              <span key={badge} className="font-sans text-[11px] text-slate-300 tracking-wide">{badge}</span>
            ))}
          </div>
          <span className="font-sans text-[12px] text-slate-400">
            FHIR® is a registered trademark of HL7
          </span>
        </div>

      </div>
    </footer>
  )
}
