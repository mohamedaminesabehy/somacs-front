import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, History, Pencil, Trash2, UserCog, Users, AlertTriangle, Mail, Building2 } from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import Modal from '../ui/Modal'
import StatusBadge from '../ui/StatusBadge'
import { EmptyState, InlineAlert, SkeletonTableRows } from '../ui/Feedback'
import { Field } from '../ui/DataKit'
import { RoleBadge, UserAvatar } from './roleStyles'

function getRoleColorKey(role) {
  if (role === 'Administrateur') return 'purple'
  if (role === 'Coordinateur' || role === 'Responsable technicien') return 'blue'
  return 'gray'
}

function RowActions({ user, onHistory, onEdit, onDelete, compact = false }) {
  const base = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors'
  return (
    <div className={compact ? 'grid grid-cols-3 gap-2' : 'flex items-center justify-end gap-1'}>
      <button type="button" onClick={onHistory} className={`${base} ${compact ? 'bg-slate-100 text-ink hover:bg-slate-200' : 'w-9 text-ink-muted hover:bg-slate-100 hover:text-ink'}`} aria-label={`Historique de ${user.name}`} title="Historique">
        <History size={15} aria-hidden="true" />
        {compact && 'Historique'}
      </button>
      <button type="button" onClick={onEdit} className={`${base} ${compact ? 'bg-brand-50 text-brand-700 hover:bg-brand-100' : 'w-9 text-ink-muted hover:bg-brand-50 hover:text-brand-700'}`} aria-label={`Modifier ${user.name}`} title="Modifier">
        <Pencil size={15} aria-hidden="true" />
        {compact && 'Modifier'}
      </button>
      <button type="button" onClick={onDelete} className={`${base} ${compact ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'w-9 text-ink-muted hover:bg-red-50 hover:text-red-600'}`} aria-label={`Supprimer ${user.name}`} title="Supprimer">
        <Trash2 size={15} aria-hidden="true" />
        {compact && 'Supprimer'}
      </button>
    </div>
  )
}

export default function UserTable({ users, isLoading, currentUser, onUsersChanged, onAction, onRolesLoaded }) {
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
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data)) {
          setAvailableRoles(data)
          onRolesLoaded?.(data.map((role) => role.name))
        }
      } catch {
        setAvailableRoles([])
      } finally {
        setIsLoadingRoles(false)
      }
    }
    fetchRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setActionError('Seul un administrateur peut modifier un utilisateur.')
      return
    }

    const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null
    if (!token) {
      setActionError('Session expirée. Veuillez vous reconnecter.')
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
        setActionError(
          response.status === 403
            ? "Vous n'avez pas l'autorisation de modifier cet utilisateur."
            : "Impossible de modifier l'utilisateur. Réessayez plus tard.",
        )
        return
      }

      const updated = await response.json()
      setUserList((prev) =>
        prev.map((user) =>
          user.id !== selectedUser.id
            ? user
            : {
                ...user,
                name: updated.name,
                email: updated.email,
                department: updated.department || '',
                role: updated.role,
                status: updated.isActive ? 'Actif' : 'Inactif',
                roleColor: getRoleColorKey(updated.role),
                statusColor: updated.isActive ? 'green' : 'gray',
              },
        ),
      )

      onUsersChanged?.()
      const prevStatus = selectedUser.status
      setIsEditOpen(false)
      setSelectedUser(null)
      if (onAction) {
        if (prevStatus !== editStatus) {
          onAction(editStatus === 'Inactif' ? 'Utilisateur désactivé' : 'Utilisateur réactivé')
        } else {
          onAction('Utilisateur modifié')
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
      setActionError('Seul un administrateur peut supprimer un utilisateur.')
      return
    }

    const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null
    if (!token) {
      setActionError('Session expirée. Veuillez vous reconnecter.')
      return
    }

    setIsSubmittingDelete(true)
    try {
      const response = await apiFetch(`/users/${selectedUser.id}`, { method: 'DELETE', auth: true })
      if (!response.ok) {
        setActionError(
          response.status === 403
            ? "Vous n'avez pas l'autorisation de supprimer cet utilisateur."
            : "Impossible de supprimer l'utilisateur. Réessayez plus tard.",
        )
        return
      }

      setUserList((prev) => prev.filter((user) => user.id !== selectedUser.id))
      setIsDeleteOpen(false)
      setSelectedUser(null)
      onUsersChanged?.()
      onAction?.('Utilisateur supprimé')
    } catch {
      setActionError("Erreur lors de la suppression de l'utilisateur.")
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  const emptyState = (
    <EmptyState
      icon={Users}
      title="Aucun utilisateur trouvé"
      description="Modifiez la recherche ou les filtres, ou créez un nouveau compte."
    />
  )

  return (
    <div className="ui-card overflow-hidden">
      <div className="divide-y divide-line lg:hidden">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-ink-muted">Chargement des utilisateurs…</div>
        ) : userList.length === 0 ? (
          <div className="p-4">{emptyState}</div>
        ) : (
          userList.map((user) => (
            <article key={user.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <UserAvatar name={user.name} role={user.role} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate font-display text-sm font-bold text-ink">{user.name}</h3>
                    <StatusBadge status={user.status} />
                  </div>
                  <p className="truncate text-xs text-ink-muted">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge role={user.role} />
                {user.department && <span className="text-xs font-medium text-ink-muted">{user.department}</span>}
              </div>
              <p className="flex items-center gap-1.5 text-xs text-ink-faint">
                <Clock size={12} aria-hidden="true" /> {user.lastLogin}
              </p>
              <RowActions
                compact
                user={user}
                onHistory={() => navigate(`/users/${user.id}/details`)}
                onEdit={() => handleOpenEdit(user)}
                onDelete={() => handleOpenDelete(user)}
              />
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-line bg-slate-50/80 text-left text-xs font-semibold text-ink-muted">
              <th scope="col" className="px-5 py-3">Utilisateur</th>
              <th scope="col" className="px-5 py-3">Département</th>
              <th scope="col" className="px-5 py-3">Rôle</th>
              <th scope="col" className="px-5 py-3">Statut</th>
              <th scope="col" className="px-5 py-3">Dernière connexion</th>
              <th scope="col" className="px-5 py-3 text-right"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading ? (
              <SkeletonTableRows rows={4} columns={6} />
            ) : userList.length === 0 ? (
              <tr><td colSpan={6} className="p-4">{emptyState}</td></tr>
            ) : (
              userList.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} role={user.role} />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/users/${user.id}/details`)}
                          className="block truncate font-semibold text-ink hover:text-brand-700"
                        >
                          {user.name}
                        </button>
                        <span className="block truncate text-xs text-ink-muted">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted">{user.department || '—'}</td>
                  <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={user.status} /></td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <Clock size={12} aria-hidden="true" className="text-ink-faint" /> {user.lastLogin}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <RowActions
                      user={user}
                      onHistory={() => navigate(`/users/${user.id}/details`)}
                      onEdit={() => handleOpenEdit(user)}
                      onDelete={() => handleOpenDelete(user)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={isEditOpen && Boolean(selectedUser)}
        onClose={handleCloseEdit}
        title="Modifier le compte"
        description={selectedUser ? `${selectedUser.name} · identifiant ${selectedUser.id}` : ''}
        icon={UserCog}
        footer={
          <>
            <button type="button" onClick={handleCloseEdit} className="ui-btn-secondary">Annuler</button>
            <button type="submit" form="edit-user-form" disabled={isSubmittingEdit} className="ui-btn-primary">
              {isSubmittingEdit ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </>
        }
      >
        {selectedUser && (
          <form id="edit-user-form" onSubmit={handleSubmitEdit} className="flex flex-col gap-5">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <UserAvatar name={selectedUser.name} role={editRole || selectedUser.role} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{selectedUser.name}</p>
                <RoleBadge role={editRole || selectedUser.role} className="mt-1" />
              </div>
            </div>
            {actionError && <InlineAlert tone="error" icon={AlertTriangle}>{actionError}</InlineAlert>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email professionnel" htmlFor="edit-email" full>
                <div className="relative">
                  <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
                  <input id="edit-email" type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} className="ui-input pl-10" required />
                </div>
              </Field>
              <Field label="Département" htmlFor="edit-department">
                <div className="relative">
                  <Building2 size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
                  <select id="edit-department" value={editDepartment} onChange={(event) => setEditDepartment(event.target.value)} className="ui-select pl-10">
                    <option value="">Non renseigné</option>
                    <option value="SOMACS Service">SOMACS Service</option>
                    <option value="SOMACS Commercial">SOMACS Commercial</option>
                  </select>
                </div>
              </Field>
              <Field label="Rôle" htmlFor="edit-role">
                <select id="edit-role" value={editRole} onChange={(event) => setEditRole(event.target.value)} className="ui-select">
                  {availableRoles.length === 0 ? (
                    <option value={editRole}>{isLoadingRoles ? 'Chargement…' : editRole || 'Aucun rôle'}</option>
                  ) : (
                    availableRoles.map((role) => <option key={role.name} value={role.name}>{role.name}</option>)
                  )}
                </select>
              </Field>
            </div>
            <fieldset>
              <legend className="ui-label">Statut du compte</legend>
              <div className="grid grid-cols-2 gap-2">
                {['Actif', 'Inactif'].map((status) => (
                  <label
                    key={status}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-semibold transition-colors ${
                      editStatus === status ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-line text-ink-muted hover:border-slate-300'
                    }`}
                  >
                    <input type="radio" name="edit-status" value={status} checked={editStatus === status} onChange={() => setEditStatus(status)} className="accent-brand-600" />
                    {status === 'Actif' ? 'Actif' : 'Désactivé'}
                  </label>
                ))}
              </div>
            </fieldset>
          </form>
        )}
      </Modal>

      <Modal
        open={isDeleteOpen && Boolean(selectedUser)}
        onClose={handleCloseDelete}
        title="Supprimer ce compte ?"
        description="Cette action est définitive. L'historique des missions reste conservé."
        icon={Trash2}
        size="sm"
        footer={
          <>
            <button type="button" onClick={handleCloseDelete} className="ui-btn-secondary">Annuler</button>
            <button type="button" onClick={handleConfirmDelete} disabled={isSubmittingDelete} className="ui-btn-danger">
              {isSubmittingDelete ? 'Suppression…' : 'Supprimer le compte'}
            </button>
          </>
        }
      >
        {selectedUser && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/60 p-3">
              <UserAvatar name={selectedUser.name} role={selectedUser.role} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{selectedUser.name}</p>
                <p className="truncate text-xs text-ink-muted">{selectedUser.email}</p>
              </div>
            </div>
            {actionError && <InlineAlert tone="error" icon={AlertTriangle}>{actionError}</InlineAlert>}
          </div>
        )}
      </Modal>
    </div>
  )
}
