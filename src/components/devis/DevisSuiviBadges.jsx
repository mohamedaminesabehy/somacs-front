/**
 * Reusable badge components for Devis Suivi module
 * Single source of truth to avoid duplication
 */
import { STATUS_META, PRIORITY_META } from '../../constants/devisSuiviConstants'

/**
 * StatusBadge — renders a status badge with color, dot, label
 * @param {string} value - STATUS value to render
 */
export function StatusBadge({ value }) {
  const m = STATUS_META[value] || STATUS_META.CREATED
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.25em] " + m.tone}>
      <span className={"h-1.5 w-1.5 rounded-full " + m.dot} />
      {m.label}
    </span>
  )
}

/**
 * PriorityBadge — renders a priority badge with color, dot, label
 * @param {string} value - PRIORITY value to render (can be null/undefined)
 */
export function PriorityBadge({ value }) {
  if (!value) return null
  const m = PRIORITY_META[value]
  if (!m) return null
  return (
    <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] " + m.tone}>
      <span className={"h-1.5 w-1.5 rounded-full " + m.dot} />
      {m.label}
    </span>
  )
}
