const PHOTOS = [
  { src: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=640&h=420&q=80', alt: 'Clinical research team reviewing evidence' },
  { src: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=640&h=420&q=80', alt: 'Physician using digital health platform' },
  { src: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=640&h=420&q=80', alt: 'Medical professional in clinical setting' },
  { src: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=640&h=420&q=80', alt: 'Doctor consulting patient data' },
  { src: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f3?auto=format&fit=crop&w=640&h=420&q=80', alt: 'Hospital clinical environment' },
  { src: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=640&h=420&q=80', alt: 'Medical team in hospital corridor' },
]

// Duplicated for seamless loop
const TRACK = [...PHOTOS, ...PHOTOS]

export default function PhotoStrip() {
  return (
    <section className="py-0 overflow-hidden bg-white" aria-hidden="true">
      {/* Thin rule */}
      <div className="h-px bg-slate-100 mx-6 md:mx-14 mb-0" />

      <div className="relative py-14">
        {/* Fade masks */}
        <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, white, transparent)' }} />
        <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, white, transparent)' }} />

        {/* Scrolling track */}
        <div
          className="flex gap-4"
          style={{
            width: 'max-content',
            animation: 'photoScroll 36s linear infinite',
          }}>
          {TRACK.map((photo, i) => (
            <div
              key={i}
              className="flex-shrink-0 rounded-2xl overflow-hidden"
              style={{ width: 320, height: 210 }}>
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100 mx-6 md:mx-14" />

      <style>{`
        @keyframes photoScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
