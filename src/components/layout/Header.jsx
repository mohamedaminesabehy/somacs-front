import { Search, Clock, Menu, LogOut } from 'lucide-react'
import NotificationBell from '../notifications/NotificationBell'

export default function Header({ onToggleSidebar, currentUser, onLogout }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center justify-between md:justify-start gap-4">
        <button
          type="button"
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0052CC] lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu size={20} />
        </button>
        <div className="flex flex-col justify-center">
          <span className="text-sm font-bold text-[#0052CC] leading-tight">Espace Travail SOMACS</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Système interne</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative w-full md:w-72 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0052CC] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] focus:bg-white transition-all shadow-sm hover:border-gray-300"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 mr-2">
            <NotificationBell />

            <button className="text-gray-500 hover:text-[#0052CC] p-2 hover:bg-[#0052CC]/5 rounded-xl transition-all">
              <Clock size={20} />
            </button>
          </div>

          <div className="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>

          {currentUser && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50/50 border border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95"
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
