import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, CheckSquare, Package, Wrench, FileText, PieChart, Settings } from 'lucide-react'
import logo from '../assets/logo.jpg'

function SidebarContent({ onClose, currentUser, onLogout }) {
  return (
    <>
      <div className="p-4 sm:p-6 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-14 h-14 bg-white rounded-md overflow-hidden flex items-center justify-center">
            <img src={logo} alt="Logo SOMACS" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">SOMACS</span>
            {currentUser && (
              <span className="text-xs text-slate-300">
                {currentUser.name || currentUser.username} ({currentUser.role})
              </span>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 sm:py-6 space-y-2">
        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
            Navigation
          </div>
          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                isActive ? 'bg-[#0052CC] text-white' : 'text-slate-300 hover:bg-[#0052CC]/10 hover:text-white'
              }`
            }
            onClick={onClose}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
        </div>

        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
            Gestion
          </div>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                isActive ? 'bg-[#0052CC] text-white' : 'text-slate-300 hover:bg-[#0052CC]/10 hover:text-white'
              }`
            }
            onClick={onClose}
          >
            <Users size={20} />
            <span>Utilisateurs</span>
          </NavLink>
          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                isActive ? 'bg-[#0052CC] text-white' : 'text-slate-300 hover:bg-[#0052CC]/10 hover:text-white'
              }`
            }
            onClick={onClose}
          >
            <CheckSquare size={20} />
            <span>Tâches</span>
          </NavLink>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-[#0052CC]/10 hover:text-white rounded-lg transition"
            onClick={onClose}
          >
            <Package size={20} />
            <span>Stock</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-[#0052CC]/10 hover:text-white rounded-lg transition"
            onClick={onClose}
          >
            <Wrench size={20} />
            <span>Interventions</span>
          </a>
        </div>

        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
            Finance & Rapports
          </div>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-[#0052CC]/10 hover:text-white rounded-lg transition"
            onClick={onClose}
          >
            <FileText size={20} />
            <span>Devis</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-[#0052CC]/10 hover:text-white rounded-lg transition"
            onClick={onClose}
          >
            <PieChart size={20} />
            <span>Rapports</span>
          </a>
        </div>

        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
            Système
          </div>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-[#0052CC]/10 hover:text-white rounded-lg transition"
            onClick={onClose}
          >
            <Settings size={20} />
            <span>Paramètres</span>
          </a>
        </div>
      </nav>

      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-semibold text-sm">
              {currentUser && currentUser.name
                ? currentUser.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('')
                : 'US'}
            </div>
            <div className="text-sm">
              <p className="font-semibold">
                {currentUser?.name || currentUser?.username || 'Utilisateur'}
              </p>
              <p className="text-slate-400 text-xs">
                {currentUser?.role || 'Connecté'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function Sidebar({ isMobileOpen, onClose, currentUser, onLogout }) {
  return (
    <>
      <div className="hidden lg:block w-56">
        <div className="fixed inset-y-0 left-0 w-56 bg-slate-900 text-white flex flex-col">
          <SidebarContent onClose={onClose} currentUser={currentUser} onLogout={onLogout} />
        </div>
      </div>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      >
        <div
          className="w-64 max-w-[80%] h-full bg-slate-900 text-white flex flex-col"
          onClick={(event) => event.stopPropagation()}
        >
          <SidebarContent onClose={onClose} currentUser={currentUser} onLogout={onLogout} />
        </div>
      </div>
    </>
  )
}
