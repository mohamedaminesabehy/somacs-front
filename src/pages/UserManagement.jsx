import { useEffect, useMemo, useState } from 'react'
import { Users, Shield } from 'lucide-react'
import UserTable from '../components/UserTable'
import CreateUserForm from '../components/CreateUserForm'
import RoleManagement from '../components/RoleManagement'

export default function UserManagement({ currentUser }) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4
  const [rawUsers, setRawUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('Tous les rôles')
  const [statusFilter, setStatusFilter] = useState('Statut: Tous')

  const fetchUsers = async () => {
    setIsLoading(true)
    setError('')
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const token =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('auth_token')
          : null

      const response = await fetch(`${baseUrl}/users`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError(
            "Vous n'êtes pas autorisé à consulter la liste des utilisateurs. Veuillez vous reconnecter.",
          )
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

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, statusFilter])

  const users = useMemo(
    () =>
      rawUsers.map((user) => {
        const initials =
          user.name && typeof user.name === 'string'
            ? user.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('')
            : 'US'

        const roleColor =
          user.role === 'Administrateur'
            ? 'purple'
            : user.role === 'Commerciale'
              ? 'blue'
              : user.role === 'Coordinateur'
                ? 'blue'
                : user.role === 'Technicien'
                  ? 'gray'
                  : 'gray'

        const isActive = Boolean(user.isActive)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          roleColor,
          status: isActive ? 'Actif' : 'Inactif',
          statusColor: isActive ? 'green' : 'gray',
          lastLogin: user.lastLogin
            ? new Date(user.lastLogin).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Jamais connecté',
          avatar: initials,
        }
      }),
    [rawUsers],
  )

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === 'Tous les rôles' || user.role === roleFilter
      const matchesStatus = statusFilter === 'Statut: Tous' || user.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  const totalUsers = filteredUsers.length
  const totalRoles = new Set(users.map((user) => user.role)).size

  const totalPages = totalUsers === 0 ? 1 : Math.ceil(totalUsers / itemsPerPage)
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = totalUsers === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage
  const endIndex = totalUsers === 0 ? 0 : Math.min(startIndex + itemsPerPage, totalUsers)
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    if (safeCurrentPage <= 1) return
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    if (safeCurrentPage >= totalPages) return
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Gestion des utilisateurs</h1>
          <p className="text-gray-600">Gérez les accès et les rôles de votre équipe SOMACS.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#E6F0FF] flex items-center justify-center">
              <Users size={22} className="text-[#0052CC]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Utilisateurs</p>
              <p className="text-lg font-semibold text-gray-900">{totalUsers}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Shield size={22} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Rôles</p>
              <p className="text-lg font-semibold text-gray-900">{totalRoles}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <UserTable
        users={paginatedUsers}
        currentPage={currentPage}
        totalUsers={totalUsers}
        itemsPerPage={itemsPerPage}
        isLoading={isLoading}
        currentUser={currentUser}
        onUsersChanged={fetchUsers}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mt-6 text-sm text-gray-600">
        <span>
          {totalUsers === 0
            ? 'Aucun utilisateur à afficher'
            : `Affichage de ${startIndex + 1} à ${endIndex} sur ${totalUsers} utilisateurs`}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePreviousPage}
            disabled={safeCurrentPage <= 1 || totalUsers === 0}
            className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={safeCurrentPage >= totalPages || totalUsers === 0}
            className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <CreateUserForm currentUser={currentUser} onUserCreated={fetchUsers} />
        <RoleManagement />
      </div>
    </div>
  )
}
