import { Check } from 'lucide-react'

const SIZE_CONFIG = {
  sm: { icon: 16, check: 16, container: 'w-9 h-9 rounded-xl', transition: 'transition-all duration-300' },
  lg: { icon: 20, check: 20, container: 'w-12 h-12 rounded-2xl', transition: 'transition-all duration-500 z-10' },
}

const STATE_CLASSES = {
  sm: {
    active: 'bg-[#0052CC] text-white shadow-lg shadow-blue-200 scale-110',
    completed: 'bg-green-500 text-white',
    pending: 'bg-slate-100 text-slate-400',
  },
  lg: {
    active: 'bg-[#0052CC] text-white shadow-xl shadow-blue-200 scale-110',
    completed: 'bg-green-500 text-white shadow-lg shadow-green-100',
    pending: 'bg-white text-slate-300 border-2 border-slate-50 group-hover:border-slate-200',
  },
}

function getStateKey(isActive, isCompleted) {
  if (isActive) return 'active'
  if (isCompleted) return 'completed'
  return 'pending'
}

/**
 * Shared step icon for horizontal and vertical steppers.
 * @param {object} props
 * @param {import('lucide-react').LucideIcon} props.icon
 * @param {boolean} props.isActive
 * @param {boolean} props.isCompleted
 * @param {'sm'|'lg'} [props.size='sm']
 */
export default function StepIcon({ icon, isActive, isCompleted, size = 'sm' }) {
  const IconComponent = icon
  const cfg = SIZE_CONFIG[size]
  const stateKey = getStateKey(isActive, isCompleted)
  const stateClass = STATE_CLASSES[size][stateKey]
  const strokeClass = isActive ? 'stroke-[3px]' : 'stroke-[2px]'

  return (
    <div className={`${cfg.container} flex items-center justify-center shrink-0 ${cfg.transition} ${stateClass}`}>
      {isCompleted
        ? <Check size={cfg.check} strokeWidth={size === 'lg' ? 4 : 3} />
        : <IconComponent size={cfg.icon} className={strokeClass} />
      }
    </div>
  )
}
