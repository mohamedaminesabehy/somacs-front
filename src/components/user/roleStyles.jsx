import { roleStyle } from './roleStyleTokens'

export function RoleBadge({ role, className = '' }) {
  const style = roleStyle(role)
  const Icon = style.icon
  return (
    <span className={`ui-badge ${style.badge} ${className}`}>
      <Icon size={12} aria-hidden="true" />
      {role}
    </span>
  )
}

export function UserAvatar({ name, role, size = 'md' }) {
  const initials = String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  const dimension = size === 'lg' ? 'h-14 w-14 text-lg rounded-2xl' : size === 'sm' ? 'h-8 w-8 text-xs rounded-lg' : 'h-10 w-10 text-sm rounded-xl'
  return (
    <span className={`flex shrink-0 items-center justify-center font-display font-bold ${dimension} ${roleStyle(role).avatar}`} aria-hidden="true">
      {initials || '?'}
    </span>
  )
}
