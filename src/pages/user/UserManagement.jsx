import { useEffect, useMemo, useRef, useState } from 'react'
import { Users, Shield, UserPlus, CheckCircle2 } from 'lucide-react'
import UserTable from '../../components/user/UserTable'
import CreateUserForm from '../../components/user/CreateUserForm'
import RoleManagement from '../../components/user/RoleManagement'

export default function UserManagement({ currentUser }) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4
  const [rawUsers, setRawUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('Tous les rôles')
  const [statusFilter, setStatusFilter] = useState('Statut: Tous')
  const [actionToast, setActionToast] = useState({ open: false, message: '' })
  const toastTimerRef = useRef(null)

  const fetchUsers = async () => {
    setIsLoading(true)
    setError('')
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null
      const response = await fetch(`${baseUrl}/users`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError("Vous n'êtes pas autorisé à consulter la liste des utilisateurs. Veuillez vous reconnecter.")
        } else {
          setError("Impossible de charger les utilisateurs.")
        }
        return
      }
      const data = await response.json()
      setRawUsers(Array.isArray(data) ? data : [])
    } catch {
      setError("Erreur lors du chargement des utilisateurs.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])
  useEffect(() => { setCurrentPage(1) }, [searchTerm, roleFilter, statusFilter])

  const fallbackRoles = useMemo(
    () => ['Administrateur', 'Technicien', 'Commerciale', 'Coordinateur', 'Responsable technicien'],
    [],
  )

  const users = useMemo(() =>
    rawUsers.map((user) => {
      const initials = user.name && typeof user.name === 'string'
        ? user.name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
        : 'US'
      const roleColor = user.role === 'Administrateur' ? 'purple'
        : user.role === 'Commerciale' || user.role === 'Coordinateur' || user.role === 'Responsable technicien' ? 'blue' : 'gray'
      const isActive = Boolean(user.isActive)
      return {
        id: user.id, name: user.name, email: user.email, department: user.department || '',
        role: user.role, roleColor,
        status: isActive ? 'Actif' : 'Inactif',
        statusColor: isActive ? 'green' : 'gray',
        lastLogin: user.lastLogin
          ? new Date(user.lastLogin).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'Jamais connecté',
        avatar: initials,
      }
    }), [rawUsers])

  const filteredUsers = useMemo(() => users.filter((user) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.department || '').toLowerCase().includes(q)
    const matchesRole   = roleFilter === 'Tous les rôles' || user.role === roleFilter
    const matchesStatus = statusFilter === 'Statut: Tous' || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  }), [users, searchTerm, roleFilter, statusFilter])

  const totalUsers    = filteredUsers.length
  const totalRoles    = new Set(users.map(u => u.role)).size
  const activeUsers   = users.filter(u => u.status === 'Actif').length
  const totalPages    = totalUsers === 0 ? 1 : Math.ceil(totalUsers / itemsPerPage)
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex    = totalUsers === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage
  const endIndex      = totalUsers === 0 ? 0 : Math.min(startIndex + itemsPerPage, totalUsers)
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const handlePreviousPage = () => { if (safeCurrentPage > 1) setCurrentPage(p => Math.max(1, p - 1)) }
  const handleNextPage     = () => { if (safeCurrentPage < totalPages) setCurrentPage(p => Math.min(totalPages, p + 1)) }

  const showActionToast = (message) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    setActionToast({ open: true, message })
    toastTimerRef.current = window.setTimeout(() => {
      setActionToast({ open: false, message: '' })
      toastTimerRef.current = null
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
  }, [])

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-slate-50 min-h-full">

      {actionToast.open && (
        <div className="fixed top-5 right-5 sm:top-6 sm:right-6 z-[120] animate-in fade-in duration-200">
          <div
            role="status"
            className="w-[320px] sm:w-[360px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex items-start gap-3.5 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Succès</p>
                <p className="text-sm font-semibold text-slate-800 leading-snug mt-0.5 break-words">{actionToast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (toastTimerRef.current) {
                    window.clearTimeout(toastTimerRef.current)
                    toastTimerRef.current = null
                  }
                  setActionToast({ open: false, message: '' })
                }}
                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
                aria-label="Fermer"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400" />
          </div>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
            <Users size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des utilisateurs</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Administrez les comptes, les rôles et les droits d'accès de l'équipe SOMACS.</p>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E6F0FF] flex items-center justify-center shrink-0">
            <Users size={22} className="text-[#0052CC]" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total comptes</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{users.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
            <UserPlus size={22} className="text-green-600" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Comptes actifs</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{activeUsers}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
            <Shield size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Rôles définis</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalRoles}</p>
          </div>
        </div>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
          <span className="text-lg">⚠️</span>
          {error}
        </div>
      )}

      {/* ── USER TABLE ── */}
      <UserTable
        users={paginatedUsers}
        currentPage={currentPage}
        totalUsers={totalUsers}
        itemsPerPage={itemsPerPage}
        isLoading={isLoading}
        currentUser={currentUser}
        onUsersChanged={fetchUsers}
        onAction={showActionToast}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* ── PAGINATION ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center text-sm text-slate-500 font-medium">
        <span>
          {totalUsers === 0
            ? 'Aucun utilisateur ne correspond aux critères sélectionnés'
            : `Affichage de ${startIndex + 1} à ${endIndex} sur ${totalUsers} utilisateur${totalUsers > 1 ? 's' : ''}`}
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={handlePreviousPage} disabled={safeCurrentPage <= 1 || totalUsers === 0}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm">
            Précédent
          </button>
          <button type="button" onClick={handleNextPage} disabled={safeCurrentPage >= totalPages || totalUsers === 0}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm">
            Suivant
          </button>
        </div>
      </div>

      {/* ── BOTTOM PANELS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <CreateUserForm
          currentUser={currentUser}
          onUserCreated={fetchUsers}
          onAction={showActionToast}
          fallbackRoles={fallbackRoles}
        />
        <RoleManagement />
      </div>
    </div>
  )
}
