import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import logo from '../../assets/logo.jpg'

export default function LoginForm({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        setError('Identifiants incorrects. Veuillez réessayer.')
      } else {
        const data = await response.json()
        if (data?.accessToken && data?.user) {
          if (onLoginSuccess) {
            onLoginSuccess(data.accessToken, data.user)
          }
          navigate('/', { replace: true })
        } else {
          setError('Réponse du serveur invalide.')
        }
      }
    } catch {
      setError("Erreur de connexion au serveur. Vérifiez que l'API est disponible.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8 text-center">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Logo SOMACS" className="h-20 sm:h-24 w-auto rounded-full shadow-lg" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Bienvenue</h1>
        <p className="text-gray-300 text-xs sm:text-sm">
          Connectez-vous pour accéder en toute sécurité à votre espace SOMACS.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {error && (
          <div className="px-3 py-2 rounded-md bg-red-600/20 border border-red-500 text-xs sm:text-sm text-red-200">
            {error}
          </div>
        )}
        <div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d’utilisateur"
            className="w-full px-3 py-3 sm:px-4 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            required
          />
        </div>

        <div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full px-3 py-3 sm:px-4 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 shadow-lg shadow-red-900/40"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Connexion en cours...
            </>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>
    </div>
  )
}
