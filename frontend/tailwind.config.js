/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory:    '#FAF8F4',
        cream:    '#F4F0E8',
        sand:     '#E8E4DC',
        ink:      '#0A0A09',
        navy:     '#0A1628',
        sky:      '#9EC8E0',
        'sky-light': '#CCE0EF',
        accent:   '#F5E047',
        'accent-warm': '#F7E2BC',
        'navy-mid': '#1E3A5F',
        teal:     '#5B8F85',
        'teal-muted': '#7BA89E',
        lavender: '#9B8BB5',
        'lavender-soft': '#EDE8F4',
        clinical: {
          bg:       '#f8fafc',
          card:     '#ffffff',
          'card-2': '#f1f5f9',
          blue:     '#3b82f6',
          green:    '#10b981',
          yellow:   '#f59e0b',
          red:      '#ef4444',
          muted:    '#6b7280',
          border:   '#e2e8f0',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        ui:      ['"Source Sans 3"', 'Inter', 'system-ui', 'sans-serif'],
        serif:   ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        editorial: '0 1px 3px rgba(15, 26, 46, 0.06), 0 24px 48px rgba(15, 26, 46, 0.08)',
        float:     '0 8px 60px rgba(15, 26, 46, 0.1), 0 2px 12px rgba(15, 26, 46, 0.06)',
      },
      backgroundImage: {
        'hero-mesh': 'linear-gradient(165deg, #D4E8E4 0%, #E8EDE8 28%, #F4F0E8 52%, #FAF5EE 78%, #FAF8F4 100%)',
        'hero-aether': 'linear-gradient(180deg, #9EC8E0 0%, #B6D4E8 14%, #CCE0EF 26%, #DCE9F2 40%, #E8EDE8 54%, #EEE8D8 68%, #F2E6CE 82%, #F5E4C4 92%, #F7E2BC 100%)',
        'grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
