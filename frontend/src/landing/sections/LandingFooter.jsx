const COLS = [
  {
    heading: 'Product',
    links: ['Platform', 'Pipeline', 'Evidence', 'FHIR Integration', 'CDS Hooks'],
  },
  {
    heading: 'Developers',
    links: ['Documentation', 'API Reference', 'SMART on FHIR', 'GitHub', 'Changelog'],
  },
  {
    heading: 'Company',
    links: ['About', 'Blog', 'Careers', 'Security', 'Contact'],
  },
  {
    heading: 'Legal',
    links: ['Privacy Policy', 'Terms of Service', 'HIPAA BAA', 'Cookie Policy'],
  },
]

export default function LandingFooter() {
  return (
    <footer className="bg-[#060E1A] border-t border-white/[0.06] px-6 md:px-14 pt-16 pb-10">
      <div className="max-w-[1200px] mx-auto">

        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10 pb-12 border-b border-white/[0.07]">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-teal/20 border border-teal/30 flex items-center justify-center">
                <span className="font-sans text-[10px] font-extrabold text-teal">CM</span>
              </div>
              <span className="font-sans text-[15px] font-bold text-white">ClinicalMed</span>
            </div>
            <p className="font-sans text-[13px] text-white/35 leading-relaxed max-w-[200px]">
              AI clinical evidence synthesis. FHIR-native. Built for medicine.
            </p>
            <a
              href="/app"
              className="inline-block mt-5 font-sans text-[12px] font-semibold text-teal border border-teal/25 rounded-lg px-3.5 py-2 hover:bg-teal/10 transition-colors"
            >
              Open platform →
            </a>
          </div>

          {COLS.map(col => (
            <div key={col.heading}>
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.09em] text-white/25 mb-4">
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link}>
                    <a
                      href="#"
                      className="font-sans text-[13px] text-white/40 hover:text-white/75 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="pt-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <span className="font-sans text-[12px] text-white/20">
            © {new Date().getFullYear()} ClinicalMed · For research use only
          </span>
          <div className="flex items-center gap-6">
            {['HIPAA', 'SOC 2', 'FHIR R4'].map(badge => (
              <span key={badge} className="font-sans text-[11px] font-semibold text-white/20 uppercase tracking-wider">{badge}</span>
            ))}
          </div>
          <span className="font-sans text-[12px] text-white/20">
            FHIR® is a registered trademark of HL7
          </span>
        </div>

      </div>
    </footer>
  )
}
