import { Inbox } from 'lucide-react'

export function EmptyState({ icon = Inbox, title = 'Aucun élément', description, action, className = '' }) {
  const Icon = icon
  return (
    <div className={`flex flex-col items-center justify-center gap-3 px-6 py-12 text-center ${className}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
        <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div>
        <p className="font-display text-sm font-bold text-ink">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function SkeletonLines({ count = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <div className="ui-skeleton h-3" style={{ width: `${70 - (index % 3) * 12}%` }} />
          <div className="ui-skeleton h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTableRows({ rows = 6, columns = 5 }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={rowIndex} aria-hidden="true">
      {Array.from({ length: columns }).map((__, colIndex) => (
        <td key={colIndex} className="px-4 py-4">
          <div className="ui-skeleton h-3" style={{ width: `${55 + ((rowIndex + colIndex) % 4) * 10}%` }} />
        </td>
      ))}
    </tr>
  ))
}

const ALERT_TONES = {
  info: 'bg-brand-50 text-brand-800 ring-brand-200',
  success: 'bg-teal-50 text-teal-800 ring-teal-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  error: 'bg-red-50 text-red-800 ring-red-200',
}

export function InlineAlert({ tone = 'info', icon, title, children, className = '' }) {
  const Icon = icon
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-2xl px-4 py-3 ring-1 ring-inset ${ALERT_TONES[tone] || ALERT_TONES.info} ${className}`}>
      {Icon && <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />}
      <div className="min-w-0 text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  )
}
