import { useState } from 'react'
import { Eye, EyeOff, AlertCircle, Lock } from 'lucide-react'
import { API_BASE_URL } from '../../api/apiClient'

/**
 * Modal overlay for inline login when accessing a protected resource
 * without authentication. Reuses the same backend login endpoint.
 */
export default function LoginRequiredModal({ isOpen, onLoginSuccess, message }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        setError('Identifiants incorrects. Veuillez réessayer.')
        return
      }

      const data = await response.json()
      if (!data?.accessToken || !data?.user) {
        setError('Réponse du serveur invalide.')
        return
      }

      // Store auth data
      window.localStorage.setItem('auth_token', data.accessToken)
      window.localStorage.setItem('auth_user', JSON.stringify(data.user))

      // Notify parent
      onLoginSuccess(data.accessToken, data.user)
    } catch {
      setError('Impossible de joindre le serveur.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
            <Lock size={24} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Connexion requise</h2>
          <p className="text-sm text-slate-500 mt-1">
            {message || 'Connectez-vous pour accéder aux détails complets de cette mission.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm font-medium text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex : jean.dupont"
              required
              autoComplete="username"
              autoFocus
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0052CC] hover:bg-[#0042a3] text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Accès réservé aux membres SOMACS.
          </p>
        </div>
      </div>
    </div>
  )
}
