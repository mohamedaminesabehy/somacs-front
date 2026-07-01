import React from 'react'
import { RefreshCw } from 'lucide-react'

/**
 * Reusable loading state indicator.
 * @param {object} props
 * @param {string} [props.message] - Loading message
 * @param {string} [props.className] - Additional wrapper classes
 */
export default function LoadingState({ message = 'Chargement...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <RefreshCw size={24} className="text-blue-500 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  )
}
