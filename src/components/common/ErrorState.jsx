import React from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Reusable error state indicator.
 * @param {object} props
 * @param {string} [props.title] - Error title
 * @param {string} [props.message] - Error message/details
 * @param {React.ReactNode} [props.action] - Optional retry button
 * @param {string} [props.className] - Additional wrapper classes
 */
export default function ErrorState({
  title = 'Erreur',
  message = 'Une erreur est survenue.',
  action = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-red-500" />
      </div>
      <h3 className="text-base font-bold text-red-700">{title}</h3>
      {message && (
        <p className="text-sm text-red-600/80 mt-1 max-w-sm">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
