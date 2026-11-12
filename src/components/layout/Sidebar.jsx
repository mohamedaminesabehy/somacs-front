import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, X } from 'lucide-react'
import logo from '../../assets/logo.jpg'
import { getNavigationSections, getUserInitials } from './navigation'

const linkBase =
  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150'

function NavItemLink({ item, onNavigate }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `${linkBase} ${
          isActive
            ? 'bg-white/[0.08] text-white before:absolute before:-left-3 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-brand-400'
            : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} strokeWidth={1.85} className={isActive ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300'} aria-hidden="true" />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function NavGroup({ item, onNavigate }) {
  const location = useLocation()
  const Icon = item.icon
  const isAnyChildActive = item.matchPaths.some((path) => location.pathname.startsWith(path))
  const [open, setOpen] = useState(isAnyChildActive)

  useEffect(() => {
    if (isAnyChildActive) setOpen(true)
  }, [isAnyChildActive])

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`${linkBase} w-full ${isAnyChildActive ? 'text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}
      >
        <Icon size={18} strokeWidth={1.85} className={isAnyChildActive ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300'} aria-hidden="true" />
        <span className="flex-1 truncate text-left">{item.label}</span>
        <ChevronDown size={15} className={`shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <div className={`grid transition-all duration-200 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="ml-[21px] mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-3">
            {item.children.map((child) => {
              const ChildIcon = child.icon
              return (
                <NavLink
                  key={child.to}
                  to={child.to}
                  end={child.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                      isActive ? 'bg-brand-600 font-semibold text-white shadow-lg shadow-brand-900/40' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                    }`
                  }
                >
                  <ChildIcon size={15} aria-hidden="true" />
                  <span className="truncate">{child.label}</span>
                </NavLink>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function SidebarContent({ onClose, currentUser, onLogout, showClose }) {
  const navigate = useNavigate()
  const sections = getNavigationSections(currentUser)

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <div className="relative flex h-full flex-col bg-navy text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 ui-blueprint [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />

      <div className="relative flex items-center justify-between gap-3 px-5 pb-5 pt-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-white/20 shadow-lg shadow-black/20">
            <img src={logo} alt="Logo SOMACS" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold leading-none tracking-tight">SOMACS</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-300/80">ERP · SAV</p>
          </div>
        </div>
        {showClose && (
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Fermer le menu">
            <X size={18} />
          </button>
        )}
      </div>

      <nav aria-label="Navigation principale" className="relative flex-1 overflow-y-auto scrollbar-navy px-4 pb-6">
        {sections.map((section) => (
          <div key={section.title} className="mt-5 first:mt-1">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{section.title}</p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) =>
                item.children ? (
                  <NavGroup key={item.label} item={item} onNavigate={onClose} />
                ) : (
                  <NavItemLink key={item.to} item={item} onNavigate={onClose} />
                ),
              )}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2.5 ring-1 ring-inset ring-white/[0.06]">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-display text-sm font-bold text-white">
              {getUserInitials(currentUser)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-navy bg-teal-400" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-white">
              {currentUser?.name || currentUser?.username || 'Utilisateur'}
            </p>
            <p className="mt-0.5 truncate text-[11px] capitalize text-slate-400">{currentUser?.role || 'Opérateur'}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-500/15 hover:text-red-300"
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ isMobileOpen, onClose, currentUser, onLogout }) {
  useEffect(() => {
    if (!isMobileOpen) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isMobileOpen, onClose])

  return (
    <>
      <aside className="hidden w-[272px] shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-[272px]">
          <SidebarContent onClose={undefined} currentUser={currentUser} onLogout={onLogout} />
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${isMobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!isMobileOpen}
      >
        <div
          className={`absolute inset-0 bg-navy/60 backdrop-blur-sm transition-opacity duration-200 ${isMobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        <div
          className={`absolute inset-y-0 left-0 w-[288px] max-w-[85%] shadow-2xl transition-transform duration-300 ease-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
        >
          <SidebarContent onClose={onClose} currentUser={currentUser} onLogout={onLogout} showClose />
        </div>
      </div>
    </>
  )
}
