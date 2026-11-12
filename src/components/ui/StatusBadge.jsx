const TONES = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  teal: 'bg-teal-50 text-teal-800 ring-teal-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  navy: 'bg-navy text-white ring-navy',
}

const DOTS = {
  brand: 'bg-brand-600',
  amber: 'bg-amber-500',
  teal: 'bg-teal-600',
  red: 'bg-red-500',
  slate: 'bg-slate-400',
  navy: 'bg-brand-300',
}

const STATUS_TONE = {
  'à faire': 'brand',
  'en cours': 'amber',
  terminée: 'teal',
  terminee: 'teal',
  bloquée: 'red',
  bloquee: 'red',
  pending: 'slate',
  assigned: 'brand',
  in_progress: 'amber',
  closed: 'teal',
  actif: 'teal',
  active: 'teal',
  inactif: 'slate',
  critique: 'red',
  haute: 'amber',
  moyenne: 'brand',
  basse: 'slate',
}

export function toneForStatus(status) {
  return STATUS_TONE[String(status || '').trim().toLowerCase()] || 'slate'
}

export default function StatusBadge({ tone, status, children, dot = true, className = '' }) {
  const resolvedTone = tone || toneForStatus(status)
  return (
    <span className={`ui-badge ${TONES[resolvedTone] || TONES.slate} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[resolvedTone] || DOTS.slate}`} aria-hidden="true" />}
      {children ?? status}
    </span>
  )
}
