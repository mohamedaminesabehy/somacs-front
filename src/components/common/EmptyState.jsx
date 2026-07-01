import React from 'react'
import { Inbox } from 'lucide-react'

/**
 * Reusable empty state placeholder.
 * @param {object} props
 * @param {string} [props.title] - Main message
 * @param {string} [props.description] - Secondary message
 * @param {React.ElementType} [props.icon] - Custom icon (defaults to Inbox)
 * @param {React.ReactNode} [props.action] - Optional action button/link
 * @param {string} [props.className] - Additional wrapper classes
 */
export default function EmptyState({
  title = 'Aucun résultat',
  description = '',
  icon = Inbox,
  action = null,
  className = '',
}) {
  const IconComponent = icon
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <IconComponent size={28} className="text-slate-400" />
      </div>
      <h3 className="text-base font-bold text-slate-700">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
