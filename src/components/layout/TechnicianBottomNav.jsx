import { NavLink } from 'react-router-dom'
import { Building2, ClipboardList, History, Settings } from 'lucide-react'

export default function TechnicianBottomNav({ currentUser }) {
  const items = [
    { to: '/missions/my', icon: ClipboardList, label: 'Missions' },
    { to: `/employees/${currentUser?.id || 'me'}/history`, icon: History, label: 'Historique' },
    { to: '/machines', icon: Settings, label: 'Machines' },
    { to: '/clients', icon: Building2, label: 'Clients' },
  ]

  return (
    <nav
      aria-label="Navigation technicien"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map(({ to, icon: Icon, label }) => (
          <li key={label}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 ${
                  isActive ? 'text-brand-700' : 'text-slate-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                      isActive ? 'bg-brand-50' : ''
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
