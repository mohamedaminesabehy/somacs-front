import { useEffect, useMemo, useRef, useState } from 'react'
import { Users, UserPlus, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import UserTable from '../../components/user/UserTable'
import PageHeader from '../../components/ui/PageHeader'
import CreateUserForm from '../../components/user/CreateUserForm'
import { StatStrip, SearchField, SegmentedFilter, Toolbar, Toast } from '../../components/ui/DataKit'
import { InlineAlert } from '../../components/ui/Feedback'
import { ROLE_STYLES } from '../../components/user/roleStyles'

const ALL_ROLES = 'Tous les rôles'
const ALL_STATUSES = 'Statut: Tous'
const ROLE_ORDER = ['Administrateur', 'Responsable technicien', 'Coordinateur', 'Technicien']
const ROLE_TONES = { Administrateur: 'slate', 'Responsable technicien': 'brand', Coordinateur: 'amber', Technicien: 'teal' }

export default function UserManagement({ currentUser }) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const [rawUsers, setRawUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState(ALL_ROLES)
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  const isAdmin = currentUser?.role === 'Administrateur'

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
        setError(
          response.status === 401 || response.status === 403
            ? "Vous n'êtes pas autorisé à consulter la liste des utilisateurs. Veuillez vous reconnecter."
            : 'Impossible de charger les utilisateurs.',
        )
        return
      }
      const data = await response.json()
      setRawUsers(Array.isArray(data) ? data : [])
    } catch {
      setError('Erreur lors du chargement des utilisateurs.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])
  useEffect(() => { setCurrentPage(1) }, [searchTerm, roleFilter, statusFilter])
  useEffect(() => () => { if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current) }, [])

  const fallbackRoles = useMemo(() => ROLE_ORDER, [])

  const users = useMemo(() =>
    rawUsers.map((user) => {
      const isActive = Boolean(user.isActive)
      return {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        role: user.role,
        roleColor: user.role === 'Administrateur' ? 'purple' : user.role === 'Coordinateur' || user.role === 'Responsable technicien' ? 'blue' : 'gray',
        status: isActive ? 'Actif' : 'Inactif',
        statusColor: isActive ? 'green' : 'gray',
        lastLogin: user.lastLogin
          ? new Date(user.lastLogin).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'Jamais connecté',
      }
    }), [rawUsers])

  const usersMatchingSearchAndStatus = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return users.filter((user) => {
      const matchesSearch = !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q) || user.department.toLowerCase().includes(q)
      const matchesStatus = statusFilter === ALL_STATUSES || user.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [users, searchTerm, statusFilter])

  const filteredUsers = useMemo(
    () => usersMatchingSearchAndStatus.filter((user) => roleFilter === ALL_ROLES || user.role === roleFilter),
    [usersMatchingSearchAndStatus, roleFilter],
  )

  const roleCounts = useMemo(() => {
    const counts = Object.fromEntries(ROLE_ORDER.map((role) => [role, 0]))
    users.forEach((user) => { counts[user.role] = (counts[user.role] || 0) + 1 })
    return counts
  }, [users])

  const activeUsers = users.filter((user) => user.status === 'Actif').length

  const stripItems = ROLE_ORDER.map((role) => ({
    key: role,
    label: role,
    hint: ROLE_STYLES[role]?.short,
    value: roleCounts[role] || 0,
    icon: ROLE_STYLES[role]?.icon,
    tone: ROLE_TONES[role],
  }))

  const totalUsers = filteredUsers.length
  const totalPages = Math.max(1, Math.ceil(totalUsers / itemsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalUsers)
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    setToast({ message, type })
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200)
  }

  const hasFilters = searchTerm !== '' || roleFilter !== ALL_ROLES || statusFilter !== ALL_STATUSES
  const resetFilters = () => {
    setSearchTerm('')
    setRoleFilter(ALL_ROLES)
    setStatusFilter(ALL_STATUSES)
  }

  const statusOptions = [
    { value: ALL_STATUSES, label: 'Tous', count: usersMatchingSearchAndStatus.length === users.length ? users.length : undefined },
    { value: 'Actif', label: 'Actifs', count: activeUsers },
    { value: 'Inactif', label: 'Désactivés', count: users.length - activeUsers },
  ]

  return (
    <div className="flex min-h-full flex-col gap-6 bg-surface p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        eyebrow="Administration"
        title="Gestion des utilisateurs"
        description={`${users.length} comptes · ${activeUsers} actifs. Gérez les rôles et accès de l'équipe SOMACS.`}
        icon={Users}
        actions={
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="ui-btn-primary"
            disabled={!isAdmin}
            title={isAdmin ? undefined : 'Réservé aux administrateurs'}
          >
            <UserPlus size={16} aria-hidden="true" /> Nouvel utilisateur
          </button>
        }
      />

      <StatStrip
        items={stripItems}
        total={users.length}
        activeKey={roleFilter === ALL_ROLES ? null : roleFilter}
        onSelect={(key) => setRoleFilter(key || ALL_ROLES)}
      />

      {error && <InlineAlert tone="error" icon={AlertTriangle}>{error}</InlineAlert>}

      <Toolbar
        summary={
          totalUsers === 0
            ? 'Aucun utilisateur ne correspond aux critères'
            : `${totalUsers} utilisateur${totalUsers > 1 ? 's' : ''}${roleFilter !== ALL_ROLES ? ` · ${roleFilter}` : ''}`
        }
        onReset={hasFilters ? resetFilters : undefined}
      >
        <SearchField
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Nom, email ou département…"
          label="Rechercher un utilisateur"
          className="lg:max-w-sm lg:flex-1"
        />
        <SegmentedFilter options={statusOptions} value={statusFilter} onChange={setStatusFilter} label="Filtrer par statut" className="lg:ml-auto" />
      </Toolbar>

      <UserTable
        users={paginatedUsers}
        isLoading={isLoading}
        currentUser={currentUser}
        onUsersChanged={fetchUsers}
        onAction={(message) => showToast(message)}
      />

      {totalUsers > itemsPerPage && (
        <nav className="flex flex-col gap-3 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination des utilisateurs">
          <span className="tabular-nums">{startIndex + 1}–{endIndex} sur {totalUsers}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage <= 1} className="ui-btn-secondary ui-btn-sm">
              <ChevronLeft size={15} aria-hidden="true" /> Précédent
            </button>
            <span className="px-2 text-xs font-semibold tabular-nums text-ink">{safeCurrentPage} / {totalPages}</span>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage >= totalPages} className="ui-btn-secondary ui-btn-sm">
              Suivant <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}

      <CreateUserForm
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUser={currentUser}
        onUserCreated={fetchUsers}
        onAction={(message) => showToast(message)}
        fallbackRoles={fallbackRoles}
      />
    </div>
  )
}
