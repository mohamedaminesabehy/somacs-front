import { Check } from 'lucide-react'

/**
 * Shared step icon used in both horizontal and vertical steppers.
 * Renders a completed checkmark or the step's icon with appropriate styling.
 *
 * @param {object} props
 * @param {import('lucide-react').LucideIcon} props.icon - The icon component for this step
 * @param {boolean} props.isActive - Whether this step is currently active
 * @param {boolean} props.isCompleted - Whether this step has been completed
 * @param {'sm' | 'lg'} [props.size='sm'] - Size variant: 'sm' for horizontal, 'lg' for vertical
 */
export default function StepIcon({ icon, isActive, isCompleted, size = 'sm' }) {
  const IconComponent = icon
  const isLarge = size === 'lg'
  const iconSize = isLarge ? 20 : 16
  const checkSize = isLarge ? 20 : 16

  const sizeClasses = isLarge
    ? 'w-12 h-12 rounded-2xl'
    : 'w-9 h-9 rounded-xl'

  let stateClasses
  if (isActive) {
    stateClasses = isLarge
      ? 'bg-[#0052CC] text-white shadow-xl shadow-blue-200 scale-110'
      : 'bg-[#0052CC] text-white shadow-lg shadow-blue-200 scale-110'
  } else if (isCompleted) {
    stateClasses = isLarge
      ? 'bg-green-500 text-white shadow-lg shadow-green-100'
      : 'bg-green-500 text-white'
  } else {
    stateClasses = isLarge
      ? 'bg-white text-slate-300 border-2 border-slate-50 group-hover:border-slate-200'
      : 'bg-slate-100 text-slate-400'
  }

  const transitionClasses = isLarge
    ? 'transition-all duration-500 z-10'
    : 'transition-all duration-300'

  return (
    <div className={`${sizeClasses} flex items-center justify-center shrink-0 ${transitionClasses} ${stateClasses}`}>
      {isCompleted
        ? <Check size={checkSize} strokeWidth={isLarge ? 4 : 3} />
        : <IconComponent size={iconSize} className={isActive ? 'stroke-[3px]' : 'stroke-[2px]'} />
      }
    </div>
  )
}
