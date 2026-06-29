import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Wrench,
  FileText,
  PieChart,
  History,
  LogOut,
  Send,
  ChevronDown,
  ChevronRight,
  List,
  PlusCircle,
  ClipboardList,
  Settings,
  Truck,
  Building2,
} from 'lucide-react'
import logo from '../../assets/logo.jpg'

function getSidebarRoleFlags(currentUser) {
  const normalizedRole = String(currentUser?.role || '').trim().toLowerCase()
  const isTechnicien = normalizedRole === 'technicien'
  const isCommerciale = normalizedRole === 'commerciale' || normalizedRole === 'commercial'
  const isResponsable = normalizedRole === 'responsable technicien' || normalizedRole.includes('responsable')
  const isCoordinateur = normalizedRole === 'coordinateur'
  return {
    isTechnicien,
    isCommerciale,
    isResponsable,
    isCoordinateur,
    canAccessDevisSuivi: normalizedRole === 'administrateur' || isCommerciale,
    canAccessAdminMenu: !isCommerciale && !isTechnicien && !isResponsable && !isCoordinateur,
    canAccessOperationsDashboard: isResponsable || isCoordinateur,
  }
}

function getUserInitials(currentUser) {
  if (!currentUser?.name) return 'US'
  return currentUser.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function SubMenu({ icon, label, children, matchPaths }) {
  const location = useLocation()
  const MenuIcon = icon
  const isAnyChildActive = matchPaths.some((path) => location.pathname.startsWith(path))
  const [open, setOpen] = useState(isAnyChildActive)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
          isAnyChildActive
            ? 'bg-slate-800 text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <MenuIcon size={20} className="group-hover:scale-110 transition-transform shrink-0" />
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

function SubLink({ to, icon, label, onClick, end }) {
  const LinkIcon = icon
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 group ${
          isActive
            ? 'bg-[#0052CC] text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`
      }
      onClick={onClick}
    >
      <LinkIcon size={16} className="group-hover:scale-110 transition-transform shrink-0" />
      <span className="font-medium text-sm">{label}</span>
    </NavLink>
  )
}

function SidebarContent({ onClose, currentUser, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const {
    isTechnicien,
    isCommerciale,
    canAccessDevisSuivi,
    canAccessAdminMenu,
    canAccessOperationsDashboard,
  } = getSidebarRoleFlags(currentUser)

  const menuLinkClass = ({ isActive }) =>
    `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
      isActive
        ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-900/40 translate-x-1'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`

  const renderOperationalMenu = () => (
    <>
      <div className="mb-8">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] px-4 mb-4 opacity-80">
          Gestion opérationnelle
        </div>
        <div className="space-y-1">
          <SubMenu icon={CheckSquare} label="Missions" matchPaths={["/missions", "/missions/assign"]}>
            <SubLink to="/missions" end icon={List} label="Missions" onClick={onClose} />
            <SubLink to="/missions/assign" icon={Send} label="Affectation de mission" onClick={onClose} />
          </SubMenu>

          <NavLink to="/machines" className={menuLinkClass} onClick={onClose}>
            <Settings size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Machines</span>
          </NavLink>

          <NavLink to="/clients" className={menuLinkClass} onClick={onClose}>
            <Building2 size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Clients 360</span>
          </NavLink>

          <NavLink to="/vehicles" className={menuLinkClass} onClick={onClose}>
            <Truck size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Véhicules</span>
          </NavLink>

          <SubMenu icon={Wrench} label="Interventions SAV" matchPaths={["/interventions"]}>
            <SubLink to="/interventions" end icon={List} label="Interventions" onClick={onClose} />
            <SubLink to="/interventions/create" icon={PlusCircle} label="Nouvelle intervention" onClick={onClose} />
          </SubMenu>

          <NavLink to="/devis" className={menuLinkClass} onClick={onClose}>
            <FileText size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Devis</span>
          </NavLink>

          {canAccessDevisSuivi && (
            <SubMenu icon={ClipboardList} label="Suivi commercial" matchPaths={["/devis-suivi"]}>
              <SubLink to="/devis-suivi" end icon={PieChart} label="Dashboard suivi" onClick={onClose} />
              <SubLink to="/devis-suivi/relance" icon={Send} label="Relances du jour" onClick={onClose} />
            </SubMenu>
          )}
        </div>
      </div>
    </>
  )

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
        {isCommerciale && (
          <div className="mb-8">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] px-4 mb-4 opacity-80">
              Commercial
            </div>
            <div className="space-y-1">
              <NavLink to="/devis" className={menuLinkClass} onClick={onClose}>
                <FileText size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Devis</span>
              </NavLink>
              <SubMenu icon={ClipboardList} label="Suivi commercial" matchPaths={["/devis-suivi"]}>
                <SubLink to="/devis-suivi" end icon={PieChart} label="Dashboard suivi" onClick={onClose} />
                <SubLink to="/devis-suivi/relance" icon={Send} label="Relances du jour" onClick={onClose} />
              </SubMenu>
            </div>
          </div>
        )}

        {isTechnicien && (
          <div className="mb-8">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] px-4 mb-4 opacity-80">
              Espace Technicien
            </div>
            <div className="space-y-1">
              <NavLink to="/missions/my" className={menuLinkClass} onClick={onClose}>
                <ClipboardList size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Mes missions</span>
              </NavLink>

              <NavLink to={`/employees/${currentUser?.id || 'me'}/history`} className={menuLinkClass} onClick={onClose}>
                <History size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Historique interventions</span>
              </NavLink>

              <NavLink to="/machines" className={menuLinkClass} onClick={onClose}>
                <Settings size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Machines</span>
              </NavLink>

              <NavLink to="/clients" className={menuLinkClass} onClick={onClose}>
                <Building2 size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Clients 360</span>
              </NavLink>
            </div>
          </div>
        )}

        {canAccessOperationsDashboard && (
          <>
            <div className="mb-8">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] px-4 mb-4 opacity-80">
                Tableau de bord
              </div>
              <NavLink to="/dashboard" end className={menuLinkClass} onClick={onClose}>
                <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Tableau de bord</span>
              </NavLink>
            </div>
            {renderOperationalMenu()}
          </>
        )}

        {canAccessAdminMenu && (
          <>
            <div className="mb-8">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] px-4 mb-4 opacity-80">
                Tableau de bord
              </div>
              <NavLink to="/dashboard" end className={menuLinkClass} onClick={onClose}>
                <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Tableau de bord</span>
              </NavLink>
            </div>
            {renderOperationalMenu()}
            <div className="mb-8">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] px-4 mb-4 opacity-80">
                Administration
              </div>
              <div className="space-y-1">
                <NavLink to="/users" className={menuLinkClass} onClick={onClose}>
                  <Users size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Utilisateurs</span>
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
                {getUserInitials(currentUser)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full" />
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
