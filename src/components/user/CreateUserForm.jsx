import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { apiFetch } from '../../api/apiClient'

export default function CreateUserForm({ currentUser, onUserCreated, onAction }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [availableRoles, setAvailableRoles] = useState([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)

  const isAdmin = currentUser?.role === 'Administrateur'

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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!isAdmin) {
      setError("Seul un administrateur peut créer un utilisateur.")
      return
    }

    if (!name || !email || !username || !role || !password || !confirmPassword) {
      setError('Tous les champs obligatoires doivent être remplis.')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null
    if (!token) {
      setError("Session expirée. Veuillez vous reconnecter.")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiFetch('/users', {
        method: 'POST',
        body: {
          name,
          email,
          username,
          password,
          role,
        },
        auth: true,
      })

      if (!response.ok) {
        const message =
          response.status === 403
            ? "Vous n'avez pas l'autorisation pour créer un utilisateur."
            : "Impossible de créer l'utilisateur. Vérifiez les informations ou réessayez."
        setError(message)
        return
      }

      setSuccess("L'utilisateur a été créé avec succès.")
      setName('')
      setEmail('')
      setUsername('')
      setRole('')
      setPassword('')
      setConfirmPassword('')
      if (onUserCreated) {
        onUserCreated()
      }
      if (onAction) {
        onAction("Utilisateur ajouté")
      }
    } catch {
      setError("Erreur lors de la création de l'utilisateur.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#E6F0FF] rounded-lg flex items-center justify-center">
          <Users size={24} className="text-[#0052CC]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Créer un utilisateur</h2>
          <p className="text-sm text-gray-600">Ajouter un nouveau membre à l'équipe</p>
        </div>
      </div>

      {!isAdmin && (
        <div className="mb-4 px-3 py-2 rounded-md bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-700">
          Seul un utilisateur avec le rôle <span className="font-semibold">Administrateur</span> peut
          créer de nouveaux comptes.
        </div>
      )}

      {error && (
        <div className="mb-3 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-700">
          {success}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Marie Curie"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
              disabled={!isAdmin || isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email professionnel <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="marie@somacs.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
              disabled={!isAdmin || isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom d'utilisateur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: mcurie"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
              disabled={!isAdmin || isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white"
              disabled={!isAdmin || isSubmitting}
            >
              <option value="">
                {isLoadingRoles ? 'Chargement des rôles...' : 'Sélectionner un rôle'}
              </option>
              {availableRoles.map((roleItem) => (
                <option key={roleItem.name} value={roleItem.name}>
                  {roleItem.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
              disabled={!isAdmin || isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
              disabled={!isAdmin || isSubmitting}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isAdmin || isSubmitting}
          className="w-full mt-6 px-4 py-2 bg-[#0052CC] text-white rounded-lg hover:bg-[#0042a3] font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Création en cours..." : "Créer l'utilisateur"}
        </button>
      </form>
    </div>
  )
}
