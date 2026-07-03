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
    console.log('[LoginForm] Redirect from URL param:', redirectParam)
    return redirectParam
  }

  // Priority 2: pending notification from sessionStorage
  try {
    const pendingMission = window.sessionStorage.getItem('pending_notification_mission')
    if (pendingMission) {
      window.sessionStorage.removeItem('pending_notification_mission')
      console.log('[LoginForm] Redirect from pending notification — missionId:', pendingMission)
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
      console.log('[LoginForm] Post-login redirect target:', redirectTarget)
      navigate(redirectTarget, { replace: true })
    } catch {
      setError(LOGIN_ERROR_MESSAGES.serverUnavailable)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>

      {/* ── BACKGROUND IMAGE ── */}
      <img
        src={machines}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />

      {/* ── OVERLAY ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, rgba(2,6,23,0.88) 0%, rgba(4,20,40,0.82) 50%, rgba(7,26,47,0.88) 100%)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* ── AMBIENT GLOWS ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(220,38,38,0.20) 0%,transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,82,204,0.18) 0%,transparent 65%)' }} />
      </div>

      {/* ── CONTENT ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.25rem',
        }}
      >
        {/* Card */}
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            background: 'rgba(10, 15, 30, 0.72)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 20,
            padding: '2.25rem 2rem',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.06) inset',
          }}
        >
          {/* Logo + product name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: '1.75rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 1px rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.4)' }}>
              <img src={logo} alt="Logo SOMACS" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 19, letterSpacing: '0.02em' }}>SOMACS</span>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Connexion
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
              Bienvenue — accédez à votre espace de travail.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', fontSize: 13, marginBottom: '1.25rem' }}>
              <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Username */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 500 }}>
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex : jean.dupont"
                required
                autoComplete="username"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#f1f5f9',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(59,130,246,0.6)' }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 500 }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    padding: '10px 44px 10px 14px',
                    color: '#f1f5f9',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(59,130,246,0.6)' }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 20px',
                borderRadius: 10,
                background: 'linear-gradient(135deg,#0052CC 0%,#1a6eff 100%)',
                boxShadow: '0 2px 16px rgba(0,82,204,0.40)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.65 : 1,
                transition: 'opacity 0.2s',
                width: '100%',
              }}
            >
              {isLoading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <p style={{ color: '#475569', fontSize: 12, lineHeight: 1.6 }}>
              Accès réservé aux membres de l'organisation SOMACS.<br />
              Contactez votre administrateur en cas de problème.
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 20, textAlign: 'center' }}>
          © {new Date().getFullYear()} SOMACS · Tous droits réservés
        </p>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

    </div>
  )
}
