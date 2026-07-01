import React from 'react'

/**
 * Reusable status badge component with dot indicator.
 * @param {object} props
 * @param {string} props.label - Display text
 * @param {string} props.colorClass - Tailwind background/text/border classes
 * @param {string} [props.dotClass] - Tailwind class for the dot indicator
 * @param {React.ElementType} [props.icon] - Optional icon component
 * @param {string} [props.className] - Additional wrapper classes
 */
export default function StatusBadge({ label, colorClass, dotClass, icon: Icon, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass} ${className}`}>
      {dotClass && <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />}
      {Icon && <Icon size={12} />}
      {label}
    </span>
  )
}
