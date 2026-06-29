import { CheckCircle2, ClipboardList, Loader2, XCircle } from 'lucide-react'

export const MISSION_STATUS_LIST = ['Ã€ faire', 'En cours', 'TerminÃ©e', 'BloquÃ©e']

export const MISSION_STATUS_STEPS = ['Ã€ faire', 'En cours', 'TerminÃ©e']

export const MISSION_PRIORITY_ORDER = { Critique: 1, Haute: 2, Moyenne: 3, Basse: 4 }

export const MISSION_PRIORITY_BAR = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-400',
  gray: 'bg-slate-300',
}

export const MISSION_PRIORITY_COLORS = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-700',
}

export const MISSION_STATUS_COLORS = {
  'Ã€ faire': 'bg-blue-100 text-blue-700',
  'En cours': 'bg-yellow-100 text-yellow-700',
  'TerminÃ©e': 'bg-green-100 text-green-700',
  'BloquÃ©e': 'bg-red-100 text-red-700',
}

export const MISSION_STATUS_CONFIG = {
  'Ã€ faire': {
    icon: ClipboardList,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500',
    calBg: 'bg-blue-100 border-blue-300 text-blue-800',
  },
  'En cours': {
    icon: Loader2,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
    calBg: 'bg-amber-100 border-amber-300 text-amber-800',
  },
  'TerminÃ©e': {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-50 text-green-700 border border-green-200',
    dot: 'bg-green-500',
    calBg: 'bg-green-100 border-green-300 text-green-800',
  },
  'BloquÃ©e': {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-50 text-red-700 border border-red-200',
    dot: 'bg-red-500',
    calBg: 'bg-red-100 border-red-300 text-red-800',
  },
}

export const MISSION_PRIORITY_CONFIG = {
  Critique: { label: 'Critique', bar: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500', color: 'text-red-600' },
  Haute: { label: 'Haute', bar: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500', color: 'text-orange-600' },
  Moyenne: { label: 'Moyenne', bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500', color: 'text-blue-600' },
  Basse: { label: 'Basse', bar: 'bg-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-100', dot: 'bg-slate-400', color: 'text-slate-500' },
}

export function getMissionPriorityColor(priority) {
  if (priority === 'Critique') return 'red'
  if (priority === 'Haute') return 'orange'
  if (priority === 'Moyenne') return 'yellow'
  return 'gray'
}

export function getMissionStatusColorKey(status) {
  if (status === 'En cours') return 'yellow'
  if (status === 'TerminÃ©e') return 'green'
  if (status === 'BloquÃ©e') return 'red'
  return 'blue'
}
