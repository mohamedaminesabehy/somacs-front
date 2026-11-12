import { useEffect, useId } from 'react'
import { X } from 'lucide-react'

const SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
}

/**
 * Modale du design system : feuille ancrée en bas sur mobile, centrée sur desktop.
 */
export default function Modal({ open, onClose, title, description, icon, size = 'md', footer, children }) {
  const titleId = useId()
  const Icon = icon

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-[2px] animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-modal animate-scale-in sm:rounded-3xl ${SIZES[size] || SIZES.md}`}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3 min-w-0">
            {Icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
                <Icon size={18} aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-base font-bold text-ink">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-ink-muted leading-relaxed">{description}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="ui-icon-btn -mr-2 h-9 w-9" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
