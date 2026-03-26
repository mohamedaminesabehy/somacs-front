import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, CheckSquare, Package, Wrench,
  FileText, PieChart, History, LogOut, Send,
  ChevronDown, ChevronRight, List, PlusCircle, ClipboardList,
} from 'lucide-react'
import logo from '../../assets/logo.jpg'

function SubMenu({ icon: Icon, label, children, matchPaths }) {
  const location = useLocation()
  const isAnyChildActive = matchPaths.some((p) => location.pathname.startsWith(p))
  const [open, setOpen] = useState(isAnyChildActive)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
          isAnyChildActive
            ? 'bg-slate-800 text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon size={20} className="group-hover:scale-110 transition-transform shrink-0" />
        <span className="font-medium flex-1 text-left">{label}</span>
        {open
          ? <ChevronDown size={15} className="shrink-0 opacity-60" />
          : <ChevronRight size={15} className="shrink-0 opacity-60" />}
      </button>
      {open && (
        <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
          {children}
        </div>
      )}
    </div>
  )
}

function SubLink({ to, icon: Icon, label, onClick, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group text-sm ${
          isActive
            ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-900/40'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`
      }
      onClick={onClick}
    >
      <Icon size={16} className="group-hover:scale-110 transition-transform shrink-0" />
      <span className="font-medium">{label}</span>
    </NavLink>
  )
}

function SidebarContent({ onClose, currentUser, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const isTechnicien = currentUser?.role === 'Technicien'

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

      <nav className="flex-1 px-4 py-4 sm:py-6 space-y-1 overflow-y-auto no-scrollbar">

        {isTechnicien ? (
          <div className="mb-8">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] px-4 mb-4 opacity-80">
              Espace Technicien
            </div>
            <div className="space-y-1">
              <NavLink
                to="/missions/my"
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-900/40 translate-x-1'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
                onClick={onClose}
              >
                <ClipboardList size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Mes missions</span>
              </NavLink>
              
              <NavLink
                to={`/employees/${currentUser?.id || 'me'}/history`}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-900/40 translate-x-1'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
                onClick={onClose}
              >
                <History size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Historique des interventions</span>
              </NavLink>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] px-4 mb-4 opacity-80">
                Menu Principal
              </div>
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-900/40 translate-x-1'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
                onClick={onClose}
              >
                <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Tableau de bord</span>
              </NavLink>

              <NavLink
                to="/devis"
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-900/40 translate-x-1'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
                onClick={onClose}
              >
                <FileText size={20} className="group-hover:scale-110 transition-transform shrink-0" />
                <span className="font-medium flex-1">Gestion Devis</span>
              </NavLink>
            </div>

            <div className="mb-8">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] px-4 mb-4 opacity-80">
                Gestion Opérationnelle
              </div>
              <div className="space-y-1">
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                      isActive
                        ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-900/40 translate-x-1'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                  onClick={onClose}
                >
                  <Users size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Utilisateurs</span>
                </NavLink>

                <SubMenu
                  icon={CheckSquare}
                  label="Missions Terrain"
                  matchPaths={['/missions/assign', '/missions/my']}
                >
                  <SubLink to="/missions" end icon={List} label="Liste des missions" onClick={onClose} />
                  <SubLink to="/missions/assign" icon={Send} label="Affecter une mission" onClick={onClose} />
                  {isTechnicien && <SubLink to="/missions/my" icon={ClipboardList} label="Mes missions" onClick={onClose} />}
                </SubMenu>

                {isTechnicien && (
                  <NavLink
                    to="/stock"
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                        isActive
                          ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-900/40 translate-x-1'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                    onClick={onClose}
                  >
                    <Package size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Gestion Stock</span>
                  </NavLink>
                )}
              </div>
            </div>

            <div className="mb-8">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] px-4 mb-4 opacity-80">
                Service Après-Vente
              </div>
              <div className="space-y-1">
                <SubMenu
                  icon={Wrench}
                  label="Interventions SAV"
                  matchPaths={['/interventions']}
                >
                  <SubLink to="/interventions" end icon={List} label="Liste des dossiers" onClick={onClose} />
                  <SubLink to="/interventions/create" icon={PlusCircle} label="Nouveau dossier" onClick={onClose} />
                  <SubLink to="/interventions/history" icon={History} label="Historique pannes" onClick={onClose} />
                </SubMenu>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] px-4 mb-4 opacity-80">
                Finance &amp; Rapports
              </div>
              <div className="space-y-1">
                <NavLink
                  to="/quotes"
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                      isActive
                        ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-900/40 translate-x-1'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                  onClick={onClose}
                >
                  <FileText size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Devis &amp; Factures</span>
                </NavLink>
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                      isActive
                        ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-900/40 translate-x-1'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                  onClick={onClose}
                >
                  <PieChart size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Analyses d'activité</span>
                </NavLink>
              </div>
            </div>
          </>
        )}

      </nav>

      <div className="mt-auto border-t border-slate-800 p-4 bg-slate-900/50">
        <div className="flex items-center justify-between gap-3 p-2 bg-slate-800/40 rounded-2xl border border-slate-700/50 shadow-inner">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0052CC] to-blue-600 rounded-xl flex items-center justify-center font-bold text-sm text-white border border-white/10 shadow-lg">
                {currentUser && currentUser.name
                  ? currentUser.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join('')
                  : 'US'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
            </div>
            <div className="text-sm overflow-hidden">
              <p className="font-bold text-white truncate leading-tight">
                {currentUser?.name || currentUser?.username || 'Utilisateur'}
              </p>
              <p className="text-slate-500 text-[11px] truncate mt-0.5">
                {currentUser?.role || 'Opérateur'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-white hover:bg-[#0052CC] rounded-xl transition-all duration-300 shadow-sm active:scale-95"
            title="Déconnexion"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  )
}

export default function Sidebar({ isMobileOpen, onClose, currentUser, onLogout }) {
  return (
    <>
      <div className="hidden lg:block w-64">
        <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col">
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
