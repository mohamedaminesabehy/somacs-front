import { useEffect, useMemo, useState } from 'react'
import { Shield, MoreVertical } from 'lucide-react'
import { apiFetch } from '../../api/apiClient'

const colorByRole = {
  Administrateur: 'bg-purple-600',
  Technicien: 'bg-gray-600',
  Commerciale: 'bg-[#0052CC]',
  Coordinateur: 'bg-blue-500',
  'Responsable technicien': 'bg-[#0052CC]',
}

export default function RoleManagement() {
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true)
      setError('')
      try {
        const response = await apiFetch('/roles', { auth: true })
        if (!response.ok) {
          setError('Impossible de charger les rôles.')
          return
        }
        const data = await response.json()
        setRoles(Array.isArray(data) ? data : [])
      } catch {
        setError("Erreur lors du chargement des rôles.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [])

  const totalRoles = roles.length
  const totalUsersAcrossRoles = useMemo(
    () => roles.reduce((sum, role) => sum + (role.usersCount ?? 0), 0),
    [roles],
  )

  const totalPages = totalRoles === 0 ? 1 : Math.ceil(totalRoles / itemsPerPage)
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = totalRoles === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage
  const endIndex = totalRoles === 0 ? 0 : Math.min(startIndex + itemsPerPage, totalRoles)
  const paginatedRoles = roles.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    if (safeCurrentPage <= 1) return
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    if (safeCurrentPage >= totalPages) return
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield size={24} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Gestion des rôles</h2>
            <p className="text-sm text-gray-600">
              Visualiser les rôles disponibles et leur niveau d’utilisation.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-3 text-xs sm:text-sm text-gray-600">
        <span>{totalRoles} rôles définis</span>
        <span>{totalUsersAcrossRoles} utilisateurs au total</span>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="px-4 py-4 text-sm text-gray-500">Chargement des rôles...</div>
        ) : roles.length === 0 ? (
          <div className="px-4 py-4 text-sm text-gray-500">
            Aucun rôle configuré pour le moment.
          </div>
        ) : (
          paginatedRoles.map((role) => (
            <div
              key={role.name}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    colorByRole[role.name] || 'bg-slate-500'
                  }`}
                ></div>
                <div>
                  <p className="font-medium text-gray-900">{role.name}</p>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {role.usersCount} utilisateur{role.usersCount > 1 ? 's' : ''}
                </span>
                <button className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {totalRoles > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mt-4 text-xs sm:text-sm text-gray-600">
          <span>
            {`Affichage de ${totalRoles === 0 ? 0 : startIndex + 1} à ${endIndex} sur ${totalRoles} rôles`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={safeCurrentPage <= 1 || totalRoles === 0}
              className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={safeCurrentPage >= totalPages || totalRoles === 0}
              className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
