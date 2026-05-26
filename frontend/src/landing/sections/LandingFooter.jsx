export default function LandingFooter() {
  return (
    <footer className="bg-ink border-t border-white/[0.06] py-10 px-6 md:px-12">
      <div className="max-w-[1080px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 flex-wrap">
        <span className="font-serif text-lg font-extrabold text-white/70">ClinicalMed</span>
        <div className="flex flex-wrap gap-7">
          {['Privacy', 'Terms', 'Security', 'Docs'].map(link => (
            <a key={link} href="#" className="font-sans text-xs text-white/30 hover:text-white/70 transition-colors">
              {link}
            </a>
          ))}
          <a href="/app" className="font-sans text-xs text-white/50 hover:text-white transition-colors">
            Launch app
          </a>
        </div>
        <span className="font-sans text-xs text-white/20">
          © {new Date().getFullYear()} ClinicalMed · For research use only
        </span>
      </div>
    </footer>
  )
}
