import { Menu, LogOut } from 'lucide-react'
import NotificationBell from '../notifications/NotificationBell'

export default function Header({ onToggleSidebar, currentUser, onLogout }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-12 items-center gap-4">
        <div className="col-span-8 md:col-span-6 flex items-center gap-4 min-w-0">
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0052CC] lg:hidden shrink-0"
            onClick={onToggleSidebar}
          >
            <Menu size={20} />
          </button>
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-sm font-bold text-[#0052CC] leading-tight truncate">Espace Travail SOMACS</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight truncate">
              Système interne
            </span>
          </div>
        </div>

        <div className="col-span-4 md:col-span-6 flex items-center justify-end gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationBell />
          </div>

          <div className="h-8 w-[1px] bg-gray-200 hidden md:block"></div>

          {currentUser && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold text-red-600 bg-red-50/50 border border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Déconnexion</span>
              <span className="sm:hidden">Sortir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
