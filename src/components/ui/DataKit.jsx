import { Search, X } from 'lucide-react'

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

export function Toast({ toast, onClose }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <div className="fixed inset-x-4 top-4 z-[120] animate-fade-up sm:left-auto sm:right-5 sm:w-96" role="status" aria-live="polite">
      <div className={`flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 shadow-raised ${isSuccess ? 'border-teal-200' : 'border-red-200'}`}>
        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isSuccess ? 'bg-teal-500' : 'bg-red-500'}`} aria-hidden="true" />
        <p className={`flex-1 text-sm font-medium leading-relaxed ${isSuccess ? 'text-teal-900' : 'text-red-800'}`}>{toast.message}</p>
        <button type="button" onClick={onClose} className="shrink-0 rounded-md p-0.5 text-ink-faint hover:text-ink" aria-label="Fermer la notification">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
