import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'

const SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  '2xl': 'sm:max-w-6xl',
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Modale du design system : feuille ancrée en bas sur mobile, centrée sur desktop.
 * `dismissible={false}` bloque Escape et le clic extérieur (opération critique en cours,
 * ou saisie non enregistrée) ; le bouton Fermer reste alors désactivé.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  size = 'md',
  footer,
  children,
  dismissible = true,
  initialFocusRef,
  side = false,
}) {
  const reducedMotion = useReducedMotion()
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const dismissibleRef = useRef(dismissible)
  const Icon = icon

  useEffect(() => {
    onCloseRef.current = onClose
    dismissibleRef.current = dismissible
  })

  useEffect(() => {
    if (!open) return undefined
    const previouslyFocused = document.activeElement
    const panel = panelRef.current

    const focusTarget = initialFocusRef?.current
      || panel?.querySelector('[data-autofocus]')
      || panel?.querySelector(FOCUSABLE)
      || panel
    requestAnimationFrame(() => focusTarget?.focus?.({ preventScroll: true }))

    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (!dismissibleRef.current) return
        event.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const nodes = [...panel.querySelectorAll(FOCUSABLE)].filter((node) => node.offsetParent !== null)
      if (nodes.length === 0) {
        event.preventDefault()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey, true)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [open, initialFocusRef])

  if (!open) return null

  const requestClose = () => {
    if (dismissible) onClose?.()
  }

  return createPortal(
    <div
      className={side ? 'fixed inset-0 z-[110] flex justify-end' : 'fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4'}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div className="absolute inset-0 bg-navy/55 backdrop-blur-[2px] animate-fade-in" onClick={requestClose} aria-hidden="true" />
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        initial={side && !reducedMotion ? { x: '100%' } : false}
        animate={{ x: 0 }}
        transition={{ duration: 0.23, ease: 'easeOut' }}
        className={side ? `relative flex h-dvh w-full min-w-0 flex-col overflow-hidden border-l border-line bg-white shadow-modal outline-none sm:rounded-l-2xl ${size === 'xl' ? 'sm:max-w-3xl' : 'sm:max-w-xl'}` : `relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-modal outline-none animate-scale-in sm:max-h-[88vh] sm:rounded-3xl ${SIZES[size] || SIZES.md}`}
      >
        {!side && <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />}
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
                <Icon size={18} aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-base font-bold text-ink text-balance">{title}</h2>
              {description && <p id={descriptionId} className="mt-0.5 text-sm leading-relaxed text-ink-muted text-pretty">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={!dismissible}
            className="ui-icon-btn -mr-2 h-9 w-9 shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Fermer"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain break-words px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line bg-slate-50/60 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </motion.div>
    </div>,
    document.body,
  )
}
