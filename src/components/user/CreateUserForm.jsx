import { useEffect, useMemo, useState } from 'react'
import { UserPlus, AlertTriangle, Lock, KeyRound } from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import Modal from '../ui/Modal'
import { Field } from '../ui/DataKit'
import { InlineAlert } from '../ui/Feedback'
import { roleStyle } from './roleStyles'

const ROLE_DESCRIPTIONS = {
  Administrateur: 'Accès complet, gestion des comptes',
  'Responsable technicien': 'Supervise les techniciens et valide les SAV',
  Coordinateur: 'Planifie et affecte les missions',
  Technicien: 'Réalise les interventions terrain',
}

export default function CreateUserForm({ open, onClose, currentUser, onUserCreated, onAction, fallbackRoles = [] }) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [availableRoles, setAvailableRoles] = useState([])

  const isAdmin = currentUser?.role === 'Administrateur'

  useEffect(() => {
    if (!open) return
    const fetchRoles = async () => {
      try {
        const response = await apiFetch('/roles', { auth: true })
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data)) {
          setAvailableRoles(
            data
              .map((item) => (typeof item === 'string' ? { name: item } : item))
              .filter((item) => item && typeof item.name === 'string' && item.name.trim().length > 0),
          )
        }
      } catch {
        setAvailableRoles([])
      }
    }
    fetchRoles()
  }, [open])

  const roleOptions = useMemo(() => {
    const combined = [...fallbackRoles, ...availableRoles.map((item) => item?.name)]
    return [...new Set(combined.filter((name) => typeof name === 'string' && name.trim()).map((name) => name.trim()))]
  }, [availableRoles, fallbackRoles])

  const resetForm = () => {
    setEmail('')
    setUsername('')
    setRole('')
    setDepartment('')
    setPassword('')
    setConfirmPassword('')
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose?.()
  }

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!isAdmin) {
      setError('Seul un administrateur peut créer un utilisateur.')
      return
    }
    if (!email || !username || !role || !department || !password || !confirmPassword) {
      setError('Tous les champs obligatoires doivent être remplis.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null
    if (!token) {
      setError('Session expirée. Veuillez vous reconnecter.')
      return
    }

    setIsSubmitting(true)
    try {
      const autoName = username.trim() || email.split('@')[0] || 'Utilisateur'
      const response = await apiFetch('/users', {
        method: 'POST',
        body: { name: autoName, department, email, username, password, role },
        auth: true,
      })

      if (!response.ok) {
        setError(
          response.status === 403
            ? "Vous n'avez pas l'autorisation de créer un utilisateur."
            : "Impossible de créer l'utilisateur. Vérifiez les informations ou réessayez.",
        )
        return
      }

      resetForm()
      onUserCreated?.()
      onAction?.('Utilisateur ajouté')
      onClose?.()
    } catch {
      setError("Erreur lors de la création de l'utilisateur.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const disabled = !isAdmin || isSubmitting

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nouvel utilisateur"
      description="Créez un compte et attribuez son rôle dans l'équipe SOMACS."
      icon={UserPlus}
      size="lg"
      footer={
        <>
          <button type="button" onClick={handleClose} className="ui-btn-secondary">Annuler</button>
          <button type="submit" form="create-user-form" disabled={disabled} className="ui-btn-primary">
            {isSubmitting ? 'Création…' : 'Créer le compte'}
          </button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
        {!isAdmin && (
          <InlineAlert tone="warning" icon={Lock}>
            Seul un <strong>Administrateur</strong> peut créer de nouveaux comptes.
          </InlineAlert>
        )}
        {error && <InlineAlert tone="error" icon={AlertTriangle}>{error}</InlineAlert>}

        <fieldset className="flex flex-col gap-3" disabled={disabled}>
          <legend className="ui-label">Rôle <span className="text-red-500" aria-hidden="true">*</span></legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {roleOptions.map((roleName) => {
              const style = roleStyle(roleName)
              const Icon = style.icon
              const selected = role === roleName
              return (
                <label
                  key={roleName}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    selected ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-600' : 'border-line hover:border-slate-300'
                  }`}
                >
                  <input type="radio" name="create-role" value={roleName} checked={selected} onChange={() => setRole(roleName)} className="sr-only" />
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.avatar}`}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{roleName}</span>
                    <span className="block text-xs leading-snug text-ink-muted">{ROLE_DESCRIPTIONS[roleName] || 'Rôle personnalisé'}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2" disabled={disabled}>
          <legend className="sr-only">Identité</legend>
          <Field label="Email professionnel" htmlFor="create-email" required>
            <input id="create-email" type="email" placeholder="prenom.nom@somacs.ma" value={email} onChange={(event) => setEmail(event.target.value)} className="ui-input" autoComplete="off" />
          </Field>
          <Field label="Nom d'utilisateur" htmlFor="create-username" required hint="Sert aussi de nom affiché.">
            <input id="create-username" type="text" placeholder="ex. mcurie" value={username} onChange={(event) => setUsername(event.target.value)} className="ui-input" autoComplete="off" />
          </Field>
          <Field label="Département" htmlFor="create-department" required full>
            <select id="create-department" value={department} onChange={(event) => setDepartment(event.target.value)} className="ui-select">
              <option value="">Sélectionner un département</option>
              <option value="SOMACS Service">SOMACS Service</option>
              <option value="SOMACS Commercial">SOMACS Commercial</option>
            </select>
          </Field>
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2" disabled={disabled}>
          <legend className="sr-only">Mot de passe</legend>
          <p className="flex items-center gap-2 text-xs font-semibold text-ink-muted sm:col-span-2">
            <KeyRound size={14} aria-hidden="true" /> Mot de passe initial
          </p>
          <Field label="Mot de passe" htmlFor="create-password" required>
            <input id="create-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="ui-input bg-white" autoComplete="new-password" />
          </Field>
          <Field label="Confirmation" htmlFor="create-confirm" required error={passwordMismatch ? 'Les mots de passe ne correspondent pas.' : undefined}>
            <input id="create-confirm" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="ui-input bg-white" autoComplete="new-password" aria-invalid={passwordMismatch} />
          </Field>
        </fieldset>
      </form>
    </Modal>
  )
}
