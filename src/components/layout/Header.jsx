import { useLocation } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react'
import NotificationBell from '../notifications/NotificationBell'
import { getRouteMeta, getUserInitials } from './navigation'

export default function Header({ onToggleSidebar, currentUser, onLogout }) {
  const { pathname } = useLocation()
  const meta = getRouteMeta(pathname)

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" className="ui-icon-btn -ml-1 lg:hidden" onClick={onToggleSidebar} aria-label="Ouvrir le menu">
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{meta.section}</p>
            <p className="truncate font-display text-[15px] font-bold leading-tight text-ink">{meta.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <NotificationBell />
          {currentUser && (
            <>
              <div className="mx-1 hidden h-8 w-px bg-line md:block" aria-hidden="true" />
              <div className="hidden items-center gap-2.5 md:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 font-display text-xs font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
                  {getUserInitials(currentUser)}
                </div>
                <div className="max-w-[160px] leading-tight">
                  <p className="truncate text-sm font-semibold text-ink">{currentUser.name || currentUser.username}</p>
                  <p className="truncate text-[11px] capitalize text-ink-muted">{currentUser.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="ui-icon-btn hover:bg-red-50 hover:text-red-600"
                aria-label="Déconnexion"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
