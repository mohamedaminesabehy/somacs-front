import { Eye, Edit2, UserCheck2, Trash2 } from 'lucide-react'

const BASE_BTN = 'flex min-h-9 items-center justify-center gap-1.5 text-xs font-semibold rounded-xl transition-colors ring-1 ring-inset active:scale-[0.98]'
const PRIMARY_BTN = `${BASE_BTN} text-ink bg-white ring-line hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200`
const DANGER_BTN = `${BASE_BTN} text-red-600 bg-white ring-red-100 hover:bg-red-50`
const DISABLED_BTN = `${BASE_BTN} text-slate-300 bg-slate-50 ring-line cursor-not-allowed pointer-events-none`

/**
 * Renders the 4 action buttons for an intervention item.
 * Used in both mobile card and desktop table row to eliminate duplication.
 *
 * @param {'card'|'table'} variant - Layout variant
 * @param {object} item - The intervention item
 * @param {boolean} isAssigned - Whether the item is already assigned
 * @param {function} onNavigate - Navigation handler (action, item)
 */
export default function InterventionActions({ variant = 'card', item, isAssigned, onNavigate }) {
  const padding = variant === 'table' ? 'px-2.5 py-1.5' : 'px-3 py-2.5'
  const shadow = variant === 'table' ? 'shadow-sm' : ''
  const iconSize = 12
  const strokeWidth = 3

  const handleClick = (action) => (e) => {
    e.stopPropagation()
    onNavigate(action, item)
  }

  return (
    <>
      <button onClick={handleClick('details')} className={`${PRIMARY_BTN} ${padding} ${shadow}`}>
        <Eye size={iconSize} strokeWidth={strokeWidth} /> Consulter
      </button>
      <button onClick={handleClick('edit')} className={`${PRIMARY_BTN} ${padding} ${shadow}`}>
        <Edit2 size={iconSize} strokeWidth={strokeWidth} /> Modifier
      </button>
      <button
        disabled={isAssigned}
        onClick={isAssigned ? undefined : handleClick('assign')}
        className={`${isAssigned ? DISABLED_BTN : PRIMARY_BTN} ${padding} ${shadow}`}
      >
        <UserCheck2 size={iconSize} strokeWidth={strokeWidth} /> Affecter
      </button>
      <button onClick={handleClick('delete')} className={`${DANGER_BTN} ${padding} ${shadow}`}>
        <Trash2 size={iconSize} strokeWidth={strokeWidth} /> Supprimer
      </button>
    </>
  )
}
