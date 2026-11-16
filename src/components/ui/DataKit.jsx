import { useEffect } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Search, X } from 'lucide-react'

const STAT_TONES = {
  brand: { icon: 'bg-brand-50 text-brand-700 ring-brand-100', bar: 'bg-brand-600' },
  teal: { icon: 'bg-teal-50 text-teal-700 ring-teal-100', bar: 'bg-teal-600' },
  amber: { icon: 'bg-amber-50 text-amber-700 ring-amber-100', bar: 'bg-amber-500' },
  red: { icon: 'bg-red-50 text-red-700 ring-red-100', bar: 'bg-red-500' },
  slate: { icon: 'bg-slate-100 text-slate-600 ring-slate-200', bar: 'bg-slate-400' },
}

/**
 * Bande d'indicateurs : une seule surface segmentée plutôt que des cartes dispersées.
 * Chaque indicateur peut servir de filtre rapide (onSelect).
 */
export function StatStrip({ items, total, activeKey, onSelect, className = '' }) {
  const grandTotal = total ?? items.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
  return (
    <div className={`ui-card grid grid-cols-1 gap-px overflow-hidden bg-line min-[420px]:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] ${className}`}>
      {items.map((item) => {
        const tone = STAT_TONES[item.tone] || STAT_TONES.brand
        const Icon = item.icon
        const isActive = activeKey != null && activeKey === item.key
        const share = grandTotal > 0 && item.showShare !== false ? Math.round(((Number(item.value) || 0) / grandTotal) * 100) : null
        const Tag = onSelect ? 'button' : 'div'
        return (
          <Tag
            key={item.key}
            type={onSelect ? 'button' : undefined}
            onClick={onSelect ? () => onSelect(isActive ? null : item.key) : undefined}
            aria-pressed={onSelect ? isActive : undefined}
            className={`group relative flex min-w-0 items-center gap-3 px-4 py-4 text-left transition-colors sm:px-5 ${
              isActive ? 'bg-brand-50' : 'bg-white'
            } ${onSelect ? 'hover:bg-slate-50 focus-visible:z-10' : ''}`}
          >
            {Icon && (
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${tone.icon}`}>
                <Icon size={18} aria-hidden="true" />
              </span>
            )}
            <span className="min-w-0">
              <span className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold tabular-nums text-ink">{item.value ?? 0}</span>
                {share != null && item.key !== 'total' && (
                  <span className="text-xs font-medium tabular-nums text-ink-faint">{share}%</span>
                )}
              </span>
              <span className="block text-xs font-semibold leading-snug text-ink-muted">{item.label}</span>
              {item.hint && (
                <span className={`mt-0.5 block text-[11px] leading-snug ${item.hintTone === 'alert' ? 'font-semibold text-red-600' : 'text-ink-faint'}`}>
                  {item.hint}
                </span>
              )}
            </span>
            {isActive && <span className={`absolute inset-x-0 bottom-0 h-0.5 ${tone.bar}`} aria-hidden="true" />}
          </Tag>
        )
      })}
    </div>
  )
}

export function SearchField({ value, onChange, placeholder = 'Rechercher…', label = 'Rechercher', className = '' }) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <label className="sr-only" htmlFor={`search-${label}`}>{label}</label>
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
      <input
        id={`search-${label}`}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="ui-input pl-10 pr-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-faint hover:bg-slate-100 hover:text-ink"
          aria-label="Effacer la recherche"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

/** Filtre segmenté horizontal, défilable sur mobile. */
export function SegmentedFilter({ options, value, onChange, label = 'Filtrer', className = '' }) {
  return (
    <div role="radiogroup" aria-label={label} className={`no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 ${className}`}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
              active ? 'bg-navy text-white shadow-sm' : 'text-ink-muted hover:bg-slate-100 hover:text-ink'
            }`}
          >
            {option.label}
            {option.count != null && (
              <span className={`rounded-md px-1.5 text-[11px] font-semibold tabular-nums ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-ink-muted'}`}>
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Barre d'outils de liste : recherche + filtres + résumé des résultats. */
export function Toolbar({ children, summary, onReset, className = '' }) {
  return (
    <div className={`ui-card flex flex-col gap-3 p-3 sm:p-4 ${className}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">{children}</div>
      {(summary || onReset) && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-ink-muted">
          <span>{summary}</span>
          {onReset && (
            <button type="button" onClick={onReset} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800">
              <X size={13} aria-hidden="true" /> Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Section de formulaire : titre, aide et grille de champs. */
export function FormSection({ title, description, icon, children, aside, className = '' }) {
  const Icon = icon
  return (
    <section className={`ui-card overflow-hidden ${className}`}>
      <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
              <Icon size={17} aria-hidden="true" />
            </span>
          )}
          <div>
            <h2 className="font-display text-[15px] font-bold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{description}</p>}
          </div>
        </div>
        {aside}
      </header>
      <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">{children}</div>
    </section>
  )
}

export function Field({ label, htmlFor, required, hint, error, full, children }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label htmlFor={htmlFor} className="ui-label">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  )
}

/** Paires libellé / valeur pour les fiches de détail. */
export function DetailList({ items, columns = 2 }) {
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 ${columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {items.filter(Boolean).map((item) => (
        <div key={item.label} className={`min-w-0 ${item.full ? 'sm:col-span-full' : ''}`}>
          <dt className="text-xs font-medium text-ink-muted">{item.label}</dt>
          <dd className="mt-1 break-words text-sm font-semibold text-ink">{item.value || <span className="font-normal text-ink-faint">—</span>}</dd>
        </div>
      ))}
    </dl>
  )
}

const TOAST_TONES = {
  success: { Icon: CheckCircle2, ring: 'border-teal-200', icon: 'bg-teal-50 text-teal-600', bar: 'bg-teal-500', title: 'Succès', duration: 3500, role: 'status' },
  error: { Icon: AlertCircle, ring: 'border-red-200', icon: 'bg-red-50 text-red-600', bar: 'bg-red-500', title: 'Erreur', duration: 7000, role: 'alert' },
  warning: { Icon: AlertTriangle, ring: 'border-amber-200', icon: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500', title: 'Attention', duration: 5500, role: 'alert' },
  info: { Icon: Info, ring: 'border-brand-200', icon: 'bg-brand-50 text-brand-600', bar: 'bg-brand-500', title: 'Information', duration: 4000, role: 'status' },
}

function ToastItem({ toast, onClose }) {
  const tone = TOAST_TONES[toast.type] || TOAST_TONES.info
  const duration = toast.duration ?? tone.duration
  const { Icon } = tone

  useEffect(() => {
    if (!duration) return undefined
    const timer = window.setTimeout(() => onClose?.(toast), duration)
    return () => window.clearTimeout(timer)
    // Le minuteur ne doit repartir que pour un nouveau message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.message, toast.type, duration])

  return (
    <div
      role={tone.role}
      className={`toast-enter pointer-events-auto relative w-full overflow-hidden rounded-2xl border bg-white shadow-raised ${tone.ring}`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone.icon}`} aria-hidden="true">
          <Icon size={17} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold leading-5 text-ink">{toast.title || tone.title}</p>
          <p className="break-words text-[13px] leading-relaxed text-ink-soft">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onClose?.(toast)}
          className="-mr-1 shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label="Fermer la notification"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      {duration > 0 && (
        <div className="h-0.5 w-full bg-slate-100" aria-hidden="true">
          <div className={`toast-progress h-full origin-left ${tone.bar}`} style={{ animationDuration: `${duration}ms` }} />
        </div>
      )}
    </div>
  )
}

/**
 * Toast latéral (en haut à droite). Accepte une notification, un tableau
 * (empilement) ou null. Types : success | error | warning | info.
 * Un Toast « success » ne doit être émis qu'après confirmation du backend.
 */
export function Toast({ toast, onClose }) {
  const items = (Array.isArray(toast) ? toast : [toast]).filter((t) => t && t.message)
  if (items.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-3 top-16 z-[120] flex flex-col gap-2.5 sm:inset-x-auto sm:right-5 sm:top-[4.5rem] sm:w-[22rem]" aria-live="polite">
      {items.map((item, index) => (
        <ToastItem key={item.id ?? `${item.type}-${item.message}-${index}`} toast={item} onClose={onClose} />
      ))}
    </div>
  )
}
