import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit2, Trash2, Shield, Clock, AlertCircle } from 'lucide-react'
import { apiFetch } from '../../api/apiClient'

const roleColors = {
  purple: 'bg-purple-100 text-purple-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-700',
}

const statusColors = {
  green: 'bg-green-100 text-green-700',
  gray: 'bg-gray-100 text-gray-700',
}

export default function UserTable({
  users,
  isLoading,
  currentUser,
  onUsersChanged,
  onAction,
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleChange,
  statusFilter,
  onStatusChange,
}) {
  const navigate = useNavigate()

  const [userList, setUserList] = useState(users)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)
  const [availableRoles, setAvailableRoles] = useState([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)

  const isAdmin = currentUser?.role === 'Administrateur'

  useEffect(() => {
    setUserList(users)
  }, [users])

  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoadingRoles(true)
      try {
        const response = await apiFetch('/roles', { auth: true })
        if (!response.ok) {
          return
        }
        const data = await response.json()
        if (Array.isArray(data)) {
          setAvailableRoles(data)
        }
      } finally {
        setIsLoadingRoles(false)
      }
    }

    fetchRoles()
  }, [])

  const handleOpenEdit = (user) => {
    setSelectedUser(user)
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditStatus(user.status)
    setEditDepartment(user.department || '')
    setActionError('')
    setIsEditOpen(true)
  }

  const handleCloseEdit = () => {
    setIsEditOpen(false)
    setSelectedUser(null)
    setActionError('')
  }

  const handleSubmitEdit = async (event) => {
    event.preventDefault()
    if (!selectedUser) return
    setActionError('')

    if (!isAdmin) {
      setActionError("Seul un administrateur peut modifier un utilisateur.")
      return
    }

    const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null
    if (!token) {
      setActionError('Session expiree. Veuillez vous reconnecter.')
      return
    }

    setIsSubmittingEdit(true)
    try {
      const response = await apiFetch(`/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: {
          email: editEmail,
          role: editRole,
          isActive: editStatus === 'Actif',
          department: editDepartment,
        },
        auth: true,
      })

      if (!response.ok) {
        const message =
          response.status === 403
            ? "Vous n'avez pas l'autorisation pour modifier cet utilisateur."
            : "Impossible de modifier l'utilisateur. Reessayez plus tard."
        setActionError(message)
        return
      }

      const updated = await response.json()

      const nextRoleColor =
        updated.role === 'Administrateur'
          ? 'purple'
          : updated.role === 'Commerciale' || updated.role === 'Coordinateur' || updated.role === 'Responsable technicien'
            ? 'blue'
            : 'gray'
      const nextStatusText = updated.isActive ? 'Actif' : 'Inactif'
      const nextStatusColor = updated.isActive ? 'green' : 'gray'

      setUserList((prev) =>
        prev.map((user) => {
          if (user.id !== selectedUser.id) return user
          return {
            ...user,
            name: updated.name,
            email: updated.email,
            department: updated.department || '',
            role: updated.role,
            status: nextStatusText,
            roleColor: nextRoleColor,
            statusColor: nextStatusColor,
          }
        }),
      )

      if (onUsersChanged) {
        onUsersChanged()
      }

      setIsEditOpen(false)
      setSelectedUser(null)
      if (onAction) {
        const prevStatus = selectedUser.status
        const nextStatus = editStatus
        if (prevStatus !== nextStatus) {
          onAction(nextStatus === 'Inactif' ? 'Utilisateur desactive' : 'Utilisateur reactive')
        } else {
          onAction('Utilisateur modifie')
        }
      }
    } catch {
      setActionError("Erreur lors de la modification de l'utilisateur.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleOpenDelete = (user) => {
    setSelectedUser(user)
    setActionError('')
    setIsDeleteOpen(true)
  }

  const handleCloseDelete = () => {
    setIsDeleteOpen(false)
    setSelectedUser(null)
    setActionError('')
  }

  const handleConfirmDelete = async () => {
    if (!selectedUser) return
    setActionError('')

    if (!isAdmin) {
      setActionError("Seul un administrateur peut supprimer un utilisateur.")
      return
    }

    const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null
    if (!token) {
      setActionError('Session expiree. Veuillez vous reconnecter.')
      return
    }

    setIsSubmittingDelete(true)
    try {
      const response = await apiFetch(`/users/${selectedUser.id}`, {
        method: 'DELETE',
        auth: true,
      })

      if (!response.ok) {
        const message =
          response.status === 403
            ? "Vous n'avez pas l'autorisation pour supprimer cet utilisateur."
            : "Impossible de supprimer l'utilisateur. Reessayez plus tard."
        setActionError(message)
        return
      }

      setUserList((prev) => prev.filter((user) => user.id !== selectedUser.id))
      setIsDeleteOpen(false)
      setSelectedUser(null)

      if (onUsersChanged) {
        onUsersChanged()
      }
      if (onAction) {
        onAction('Utilisateur supprime')
      }
    } catch {
      setActionError("Erreur lors de la suppression de l'utilisateur.")
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center bg-slate-50/50">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] transition-all font-medium placeholder:text-slate-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] transition-all cursor-pointer"
        >
          <option>Tous les roles</option>
          {availableRoles.map((role) => (
            <option key={role.name} value={role.name}>{role.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] transition-all cursor-pointer"
        >
          <option>Statut: Tous</option>
          <option>Actif</option>
          <option>Inactif</option>
        </select>
      </div>

      {/* Mobile / tablet cards */}
      <div className="lg:hidden bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-[#0052CC]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <p className="text-sm font-semibold text-slate-400">Chargement des utilisateurs...</p>
            </div>
          </div>
        ) : userList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Shield size={24} className="text-slate-300" />
              </div>
              <p className="font-bold text-slate-500">Aucun utilisateur trouve</p>
              <p className="text-sm text-slate-400">Modifiez vos criteres ou creez un nouveau compte.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {userList.map((user) => (
              <div key={user.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-5 transition active:scale-[0.99] sm:hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0052CC] to-blue-700 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                      {user.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${statusColors[user.statusColor]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.statusColor === 'green' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    {user.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${roleColors[user.roleColor]}`}>
                    {user.role === 'Administrateur' && <Shield size={12} />}
                    {user.role}
                  </span>
                  {user.department && (
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{user.department}</span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Clock size={13} className="text-slate-400 shrink-0" />
                  {user.lastLogin}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/users/${user.id}/details`)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    Historique
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(user)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(user)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto hidden lg:block">
        <table className="w-full min-w-[840px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-3.5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
              <th className="px-6 py-3.5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Email</th>
              <th className="px-6 py-3.5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Departement</th>
              <th className="px-6 py-3.5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Role</th>
              <th className="px-6 py-3.5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
              <th className="px-6 py-3.5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Derniere connexion</th>
              <th className="px-6 py-3.5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr><td colSpan={7} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-[#0052CC]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  <p className="text-sm font-semibold text-slate-400">Chargement des utilisateurs...</p>
                </div>
              </td></tr>
            ) : userList.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <Shield size={24} className="text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-500">Aucun utilisateur trouve</p>
                  <p className="text-sm text-slate-400">Modifiez vos criteres ou creez un nouveau compte.</p>
                </div>
              </td></tr>
            ) : (
              userList.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0052CC] to-blue-700 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                        {user.avatar}
                      </div>
                      <span className="font-semibold text-slate-900 text-sm">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{user.department || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${roleColors[user.roleColor]}`}>
                      {user.role === 'Administrateur' && <Shield size={12} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${statusColors[user.statusColor]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.statusColor === 'green' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <Clock size={13} className="text-slate-400 shrink-0" />
                      {user.lastLogin}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/users/${user.id}/details`)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 hover:text-blue-800"
                        title="Historique"
                        aria-label={`Historique ${user.name}`}
                      >
                        Historique
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(user)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:border-amber-200 hover:bg-amber-100 hover:text-amber-800"
                        title="Modifier"
                        aria-label={`Modifier ${user.name}`}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(user)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-200 hover:bg-rose-100 hover:text-rose-800"
                        title="Supprimer"
                        aria-label={`Supprimer ${user.name}`}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E6F0FF] rounded-xl flex items-center justify-center">
                  <Edit2 size={20} className="text-[#0052CC]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Modifier le profil</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">ID: {selectedUser.id}</p>
                </div>
              </div>
              <button onClick={handleCloseEdit} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6">
              {actionError && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-3">
                  <AlertCircle size={18} />
                  <p className="font-medium">{actionError}</p>
                </div>
              )}

              <form onSubmit={handleSubmitEdit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Email professionnel
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(event) => setEditEmail(event.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Departement
                    </label>
                    <select
                      value={editDepartment}
                      onChange={(event) => setEditDepartment(event.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] focus:bg-white transition-all font-bold text-gray-700"
                    >
                      <option value="">Selectionner un departement</option>
                      <option value="SOMACS Commercial">SOMACS Commercial</option>
                      <option value="SOMACS Service">SOMACS Service</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Role systeme
                    </label>
                    <select
                      value={editRole}
                      onChange={(event) => setEditRole(event.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] focus:bg-white transition-all font-bold text-gray-700"
                    >
                      {availableRoles.length === 0 ? (
                        <option value="">{isLoadingRoles ? 'Chargement...' : 'Aucun role'}</option>
                      ) : (
                        availableRoles.map((role) => (
                          <option key={role.name} value={role.name}>
                            {role.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Statut du compte
                    </label>
                    <select
                      value={editStatus}
                      onChange={(event) => setEditStatus(event.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] focus:bg-white transition-all font-bold text-gray-700"
                    >
                      <option value="Actif">Actif</option>
                      <option value="Inactif">Inactif</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-all active:scale-95"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="flex-[2] px-6 py-3 bg-[#0052CC] hover:bg-[#0042a3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#0052CC]/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isSubmittingEdit ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Enregistrement...
                      </span>
                    ) : 'Mettre a jour'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isDeleteOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Supprimer l'utilisateur</h2>
              <p className="text-sm text-gray-500 mb-6">
                Etes-vous sur de vouloir supprimer <span className="font-bold text-gray-900">{selectedUser.name}</span> ? Cette action est irreversible.
              </p>

              {actionError && (
                <div className="mb-6 px-4 py-2 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-medium">
                  {actionError}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isSubmittingDelete}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-600/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                >
                  {isSubmittingDelete ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Suppression...
                    </span>
                  ) : 'Confirmer la suppression'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseDelete}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-all active:scale-95"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
