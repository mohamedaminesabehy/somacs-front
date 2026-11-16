import { ShieldCheck, ClipboardList, Wrench, HardHat } from 'lucide-react'

export const ROLE_STYLES = {
  Administrateur: {
    icon: ShieldCheck,
    badge: 'bg-navy text-white ring-navy',
    avatar: 'bg-navy text-white',
    short: 'Admin',
  },
  'Responsable technicien': {
    icon: HardHat,
    badge: 'bg-brand-50 text-brand-800 ring-brand-200',
    avatar: 'bg-brand-600 text-white',
    short: 'Resp. technique',
  },
  Coordinateur: {
    icon: ClipboardList,
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    avatar: 'bg-amber-500 text-white',
    short: 'Coordination',
  },
  Technicien: {
    icon: Wrench,
    badge: 'bg-teal-50 text-teal-800 ring-teal-200',
    avatar: 'bg-teal-600 text-white',
    short: 'Terrain',
  },
}

const DEFAULT_ROLE_STYLE = {
  icon: Wrench,
  badge: 'bg-slate-100 text-slate-700 ring-slate-200',
  avatar: 'bg-slate-500 text-white',
  short: '',
}

export function roleStyle(role) {
  return ROLE_STYLES[role] || DEFAULT_ROLE_STYLE
}
