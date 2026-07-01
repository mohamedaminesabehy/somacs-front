import React from 'react'

/**
 * Reusable section card wrapper for detail pages.
 * @param {object} props
 * @param {string} [props.title] - Section title
 * @param {React.ElementType} [props.icon] - Section icon
 * @param {React.ReactNode} [props.headerAction] - Action rendered in header right
 * @param {React.ReactNode} props.children - Section content
 * @param {string} [props.className] - Additional wrapper classes
 */
export default function SectionCard({ title, icon: Icon, headerAction, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Icon size={16} className="text-slate-600" />
              </div>
            )}
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          </div>
          {headerAction}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}
