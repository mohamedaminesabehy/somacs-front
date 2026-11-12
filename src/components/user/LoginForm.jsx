import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'
import logo from '../../assets/logo.jpg'
import machines from '../../assets/login.jpg'

const LOGIN_ERROR_MESSAGES = {
  invalidCredentials: 'Identifiants incorrects. Veuillez réessayer.',
  invalidResponse: 'Réponse du serveur invalide.',
  serverUnavailable: 'Impossible de joindre le serveur.',
}

function getLoginApiUrl() {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return baseUrl + '/auth/login'
}

async function loginRequest(username, password) {
  const response = await fetch(getLoginApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (response.status === 403) {
    const payload = await response.json().catch(() => null)
    return { error: payload?.message || LOGIN_ERROR_MESSAGES.invalidCredentials }
  }
  if (!response.ok) {
    return { error: LOGIN_ERROR_MESSAGES.invalidCredentials }
  }

  const data = await response.json()
  if (!data?.accessToken || !data?.user) {
    return { error: LOGIN_ERROR_MESSAGES.invalidResponse }
  }

  return { data }
}

/**
 * Determines where to navigate after a successful login.
 * Priority: 1) ?redirect= URL param  2) pending_notification_mission in storage  3) /
 */
function getPostLoginRedirect(searchParams) {
  // Priority 1: explicit redirect URL param
  const redirectParam = searchParams.get('redirect')
  if (redirectParam && redirectParam.startsWith('/')) {
    return redirectParam
  }

  // Priority 2: pending notification from sessionStorage
  try {
    const pendingMission = window.sessionStorage.getItem('pending_notification_mission')
    if (pendingMission) {
      window.sessionStorage.removeItem('pending_notification_mission')
      return `/missions/${pendingMission}`
    }
  } catch { /* storage may be unavailable */ }

  // Priority 3: default home
  return '/'
}

export default function LoginForm({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const result = await loginRequest(username, password)
      if (result.error) {
        setError(result.error)
        return
      }

      if (onLoginSuccess) onLoginSuccess(result.data.accessToken, result.data.user)

      // Post-login redirect: priority 1 = URL param, priority 2 = sessionStorage, priority 3 = default
      const redirectTarget = getPostLoginRedirect(searchParams)

      // Store redirect target in sessionStorage so App.jsx can use it after re-render
      // (the navigate() below may be overridden by React re-render unmounting this component)
      if (redirectTarget !== '/') {
        try { window.sessionStorage.setItem('post_login_redirect', redirectTarget) } catch { /* best-effort */ }
      }

      navigate(redirectTarget, { replace: true })
    } catch {
      setError(LOGIN_ERROR_MESSAGES.serverUnavailable)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="relative flex min-h-screen w-full bg-canvas">
      <aside className="relative hidden w-[46%] max-w-[720px] overflow-hidden bg-navy text-white lg:flex lg:flex-col">
        <img src={machines} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-navy/70" aria-hidden="true" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-xl bg-white ring-1 ring-white/20">
              <img src={logo} alt="Logo SOMACS" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-display text-xl font-extrabold tracking-tight">SOMACS</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-brand-300">ERP · Service après-vente</p>
            </div>
          </div>

          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">Espace de travail interne</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight text-balance">
              Pilotez chaque intervention, du terrain au bureau.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300 text-pretty">
              Missions, fiches d&apos;intervention, parc machines et clients réunis dans un seul outil.
            </p>
          </div>

          <p className="text-xs text-slate-400">© {new Date().getFullYear()} SOMACS · Tous droits réservés</p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="h-11 w-11 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
              <img src={logo} alt="Logo SOMACS" className="h-full w-full object-cover" />
            </div>
            <p className="font-display text-lg font-extrabold tracking-tight text-slate-900">SOMACS</p>
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">Connexion</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">Bienvenue — accédez à votre espace de travail.</p>

          {error && (
            <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-username" className="text-sm font-medium text-slate-700">Nom d&apos;utilisateur</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex : jean.dupont"
                required
                autoComplete="username"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/15"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-slate-700">Mot de passe</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500">
            Accès réservé aux membres de l&apos;organisation SOMACS. Contactez votre administrateur en cas de problème.
          </p>
        </div>
      </main>
    </div>
  )
}
