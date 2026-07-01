import React from 'react'

/**
 * Reusable action button with icon support.
 * @param {object} props
 * @param {React.ReactNode} props.children - Button text
 * @param {React.ElementType} [props.icon] - Leading icon
 * @param {'primary'|'secondary'|'danger'|'ghost'} [props.variant] - Button style
 * @param {boolean} [props.disabled] - Disabled state
 * @param {boolean} [props.loading] - Loading state
 * @param {string} [props.className] - Additional classes
 */
export default function ActionButton({
  children,
  icon: Icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  ...rest
}) {
  const variantClasses = {
    primary: 'bg-[#0052CC] text-white hover:bg-[#003d99] shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  }

  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={16} className={loading ? 'animate-spin' : ''} />}
      {children}
    </button>
  )
}
