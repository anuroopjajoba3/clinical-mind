export default function SectionHeader({ eyebrow, title, subtitle, align = 'left', dark = false, className = '' }) {
  const alignCls = align === 'center' ? 'text-center mx-auto' : ''
  return (
    <div className={`max-w-2xl ${alignCls} ${className}`}>
      {eyebrow && (
        <p className={`font-sans text-[11px] font-semibold tracking-[0.14em] uppercase mb-4 ${dark ? 'text-teal-muted' : 'text-teal'}`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`font-serif text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-[1.08] tracking-tight ${dark ? 'text-ivory' : 'text-ink'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-5 font-sans text-base leading-relaxed ${dark ? 'text-ivory/55' : 'text-slate-600'} ${align === 'center' ? 'max-w-lg mx-auto' : 'max-w-md'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
