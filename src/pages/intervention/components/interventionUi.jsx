import { useId } from 'react'
import {
  Wrench, Zap, ShieldCheck, FileSearch, GraduationCap, Truck,
  AlertTriangle, CheckCircle2, Info, RefreshCw, Check,
} from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import { INTERVENTION_TYPES } from './interventionTypes'


/** Section numérotée d'un dossier : en-tête « onglet » + contenu. */
export function DossierSection({ index, icon, title, description, actions, children, className = '' }) {
  const Icon = icon
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className={`overflow-hidden rounded-2xl border border-line bg-white shadow-card ${className}`}>
      <header className="flex flex-col gap-3 border-b border-line bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-white shadow-raised">
            {Icon && <Icon size={19} aria-hidden="true" />}
            {index != null && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white tabular-nums">
                {index}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-base font-bold leading-tight text-ink sm:text-lg">{title}</h2>
            {description && <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="flex flex-col gap-6 p-4 sm:p-6">{children}</div>
    </section>
  )
}

/** Sous-groupe de champs avec intitulé discret. */
export function FieldGroup({ title, icon, children, columns = 2 }) {
  const Icon = icon
  const cols = columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : columns === 1 ? '' : 'sm:grid-cols-2'
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      {title && (
        <legend className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
          {Icon && <Icon size={13} className="text-brand-600" aria-hidden="true" />}
          {title}
          <span className="ml-1 h-px flex-1 bg-line" aria-hidden="true" />
        </legend>
      )}
      <div className={`grid grid-cols-1 gap-4 ${cols}`}>{children}</div>
    </fieldset>
  )
}

export function FormField({ label, htmlFor, required, hint, error, icon, full, counter, children }) {
  const Icon = icon
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${full ? 'sm:col-span-full' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-xs font-semibold text-ink-soft">
          {label}
          {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
          {required && <span className="sr-only"> (obligatoire)</span>}
        </label>
        {counter != null && <span className="text-[11px] font-medium text-ink-faint tabular-nums">{counter}</span>}
      </div>
      <div className="relative">
        {Icon && <Icon size={16} className="pointer-events-none absolute left-3.5 top-3 text-ink-faint" aria-hidden="true" />}
        {children}
      </div>
      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600" role="alert">
          <AlertTriangle size={12} aria-hidden="true" /> {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-ink-faint">{hint}</p>
      ) : null}
    </div>
  )
}

/** Valeur en lecture seule, présentée comme une donnée de fiche plutôt qu'un champ grisé. */
export function DataTile({ label, value, mono, full, icon, emphasis }) {
  const Icon = icon
  const empty = value == null || String(value).trim() === ''
  return (
    <div className={`flex min-w-0 items-start gap-3 rounded-xl border border-line bg-slate-50/60 px-3.5 py-3 ${full ? 'sm:col-span-full' : ''}`}>
      {Icon && (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 ring-1 ring-inset ring-line">
          <Icon size={14} aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
        <p className={`mt-0.5 break-words text-sm ${empty ? 'italic text-ink-faint' : emphasis ? 'font-semibold text-ink' : 'font-medium text-ink-soft'} ${mono && !empty ? 'font-mono tracking-wide' : ''}`}>
          {empty ? 'Non renseigné' : value}
        </p>
      </div>
    </div>
  )
}

/** Sélecteur visuel du type d'intervention (remplace l'ancien <select> à emojis). */
export function InterventionTypePicker({ name = 'interventionType', value, onChange, disabled, compact }) {
  const groupId = useId()
  return (
    <div role="radiogroup" aria-labelledby={`${groupId}-label`} className="flex flex-col gap-2">
      <p id={`${groupId}-label`} className="text-xs font-semibold text-ink-soft">
        Type d&apos;intervention<span className="ml-0.5 text-red-600" aria-hidden="true">*</span>
      </p>
      <div className={`grid grid-cols-2 gap-2 ${compact ? 'lg:grid-cols-3' : 'sm:grid-cols-3'}`}>
        {INTERVENTION_TYPES.map((type) => {
          const active = value === type.value
          const Icon = type.icon
          return (
            <button
              key={type.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange({ target: { name, value: type.value } })}
              className={`group relative flex min-w-0 items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:cursor-not-allowed disabled:opacity-60
                ${active ? 'border-brand-600 bg-brand-50/70 shadow-lift' : 'border-line bg-white hover:border-brand-200 hover:bg-slate-50'}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-muted group-hover:text-brand-700'}`}>
                <Icon size={15} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-sm font-semibold ${active ? 'text-brand-800' : 'text-ink'}`}>{type.label}</span>
                <span className="block truncate text-[11px] text-ink-faint">{type.hint}</span>
              </span>
              {active && (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-white" aria-hidden="true">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const DIALOG_TONES = {
  danger: { icon: AlertTriangle, button: 'ui-btn-danger', panel: 'bg-red-50/70 ring-red-100 text-red-800' },
  warning: { icon: AlertTriangle, button: 'ui-btn-primary', panel: 'bg-amber-50 ring-amber-200 text-amber-900' },
  success: { icon: CheckCircle2, button: 'ui-btn-primary', panel: 'bg-teal-50 ring-teal-200 text-teal-900' },
  info: { icon: Info, button: 'ui-btn-primary', panel: 'bg-brand-50 ring-brand-100 text-brand-900' },
}

/**
 * Confirmation / notification unifiée. Sans `onConfirm`, la modale sert de simple message
 * (remplace les `alert()` / `window.confirm()` natifs).
 */
export function ConfirmDialog({
  open, tone = 'info', title, description, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler',
  busy = false, busyLabel = 'Traitement…', onConfirm, onClose, children,
}) {
  const config = DIALOG_TONES[tone] || DIALOG_TONES.info
  const isNotice = !onConfirm
  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!busy}
      size="sm"
      icon={config.icon}
      title={title}
      description={description}
      footer={
        isNotice ? (
          <button type="button" onClick={onClose} className="ui-btn-primary" data-autofocus>Compris</button>
        ) : (
          <>
            <button type="button" onClick={onClose} disabled={busy} className="ui-btn-secondary">{cancelLabel}</button>
            <button type="button" onClick={onConfirm} disabled={busy} className={config.button} data-autofocus>
              {busy && <RefreshCw size={15} className="animate-spin" aria-hidden="true" />}
              {busy ? busyLabel : confirmLabel}
            </button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-3">
        {message && (
          <p className={`rounded-xl px-4 py-3 text-sm font-medium leading-relaxed ring-1 ring-inset ${config.panel}`}>{message}</p>
        )}
        {children}
      </div>
    </Modal>
  )
}
