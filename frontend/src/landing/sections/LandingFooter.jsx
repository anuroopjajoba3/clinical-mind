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
    <footer className="bg-ink px-6 md:px-10 pt-16 pb-10">
      <div className="max-w-[1080px] mx-auto">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10 pb-12 border-b border-white/[0.07]">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-sans text-[15px] font-bold text-white">ClinicalMed</span>
            <p className="font-sans text-[13px] text-white/35 mt-3 leading-relaxed max-w-[200px]">
              AI clinical evidence synthesis. FHIR-native. Built for medicine.
            </p>
            <a
              href="/app"
              className="inline-block mt-5 font-sans text-[12px] font-semibold text-white/70 border border-white/15 rounded px-3 py-1.5 hover:border-white/35 hover:text-white transition-colors"
            >
              Open platform →
            </a>
          </div>

          {COLS.map(col => (
            <div key={col.heading}>
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.09em] text-white/30 mb-4">
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link}>
                    <a
                      href="#"
                      className="font-sans text-[13px] text-white/45 hover:text-white/80 transition-colors"
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
          <span className="font-sans text-[12px] text-white/20">
            FHIR® is a registered trademark of HL7
          </span>
        </div>
      </div>
    </footer>
  )
}
