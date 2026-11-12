/** @type {import('tailwindcss').Config} */
// Design system SOMACS — « Bleu Premium ».
// Les palettes Tailwind par défaut (slate, blue…) ne sont PAS redéfinies : les aperçus
// de fiches d'intervention (FicheContent / FichePreviewFrame) les utilisent et doivent
// rester strictement identiques. Toutes les couleurs de l'interface passent par les
// tokens ajoutés ci-dessous (brand, navy, ink, canvas, line, teal, amber).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1e293b',
          900: '#0f172a',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        navy: {
          DEFAULT: '#0B1530',
          900: '#0B1530',
          800: '#111D3F',
          700: '#1A2A55',
          600: '#26386B',
        },
        ink: {
          DEFAULT: '#0F172A',
          soft: '#1E293B',
          muted: '#64748B',
          faint: '#94A3B8',
        },
        canvas: '#F5F7FB',
        line: '#E3E8F0',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.05)',
        raised: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.18)',
        lift: '0 12px 32px -12px rgba(29, 78, 216, 0.30)',
        focus: '0 0 0 4px rgba(37, 99, 235, 0.15)',
        modal: '0 24px 64px -16px rgba(11, 21, 48, 0.35)',
      },
      borderRadius: {
        xl2: '1.125rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 360ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 200ms ease-out both',
        'scale-in': 'scale-in 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-left': 'slide-in-left 280ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
