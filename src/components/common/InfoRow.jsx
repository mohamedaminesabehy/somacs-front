import React from 'react'

/**
 * Reusable key-value info row for detail pages.
 * @param {object} props
 * @param {string} props.label - Field label
 * @param {React.ReactNode} props.value - Field value
 * @param {React.ElementType} [props.icon] - Optional leading icon
 * @param {string} [props.className] - Additional wrapper classes
 */
export default function InfoRow({ label, value, icon: Icon, className = '' }) {
  return (
    <div className={`flex items-start gap-3 py-2 ${className}`}>
      {Icon && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
          <Icon size={14} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">
          {value || <span className="text-slate-400 italic">—</span>}
        </p>
      </div>
    </div>
  )
}
