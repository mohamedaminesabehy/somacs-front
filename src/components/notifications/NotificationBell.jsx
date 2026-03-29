import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../notifications/NotificationsProvider'

function formatDate(value) {
  try {
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
  } catch {
    return ''
  }
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, enablePushNotifications } = useNotifications()
  const [open, setOpen] = useState(false)
  const [pushState, setPushState] = useState({ status: 'idle', message: '' })
  const rootRef = useRef(null)

  const items = useMemo(() => (Array.isArray(notifications) ? notifications.slice(0, 12) : []), [notifications])
  const permission =
    typeof window !== 'undefined' && typeof window.Notification !== 'undefined' ? window.Notification.permission : null

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (!rootRef.current) return
      if (rootRef.current.contains(e.target)) return
      setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative text-gray-500 hover:text-[#0052CC] p-2 hover:bg-[#0052CC]/5 rounded-xl transition-all"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[320px] sm:w-[360px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="font-black text-sm text-slate-900">Notifications</div>
            <button
              type="button"
              onClick={async () => {
                await markAllRead()
              }}
              disabled={unreadCount === 0}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                unreadCount === 0
                  ? 'text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed'
                  : 'text-[#0052CC] border-[#0052CC]/20 bg-[#0052CC]/5 hover:bg-[#0052CC]/10'
              }`}
            >
              Tout lire
            </button>
          </div>

          {permission && permission !== 'granted' && (
            <div className="px-4 py-3 border-b border-gray-100 bg-amber-50/40">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-amber-900">
                  Activez les notifications push pour recevoir les missions en arrière-plan.
                  {pushState.status === 'error' && (
                    <div className="mt-1 text-[11px] font-bold text-red-700">{pushState.message}</div>
                  )}
                  {pushState.status === 'enabled' && (
                    <div className="mt-1 text-[11px] font-bold text-emerald-700">{pushState.message}</div>
                  )}
                  {pushState.status === 'loading' && (
                    <div className="mt-1 text-[11px] font-bold text-amber-900">Activation en cours…</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setPushState({ status: 'loading', message: '' })
                    const res = await enablePushNotifications()
                    if (res && res.ok) {
                      setPushState({
                        status: 'enabled',
                        message: 'Notifications activées.',
                      })
                      return
                    }
                    const reason = res?.reason || 'unknown'
                    const msg =
                      reason === 'unsupported'
                        ? "Votre navigateur ne supporte pas les notifications push."
                        : reason === 'permission-denied'
                          ? "Autorisation refusée. Activez-la dans les réglages du navigateur."
                          : reason === 'missing-vapid'
                            ? "Configuration VAPID manquante côté frontend."
                            : reason === 'missing-config'
                              ? "Configuration Firebase manquante côté frontend."
                              : reason === 'sw-failed'
                                ? "Service Worker non installé (HTTPS requis, ou blocage navigateur)."
                                : reason === 'token-failed'
                                  ? "Impossible d'obtenir le token push (Firebase)."
                                  : reason === 'unauthorized'
                                    ? "Session expirée. Reconnectez-vous puis réessayez."
                                    : "Échec d’activation. Ouvrez la console pour plus de détails."
                    setPushState({ status: 'error', message: msg })
                  }}
                  disabled={pushState.status === 'loading'}
                  className={`shrink-0 text-xs font-black px-3 py-1.5 rounded-xl transition-all ${
                    pushState.status === 'loading'
                      ? 'bg-amber-300 text-white cursor-not-allowed'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                >
                  Activer
                </button>
              </div>
            </div>
          )}

          <div className="max-h-[380px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500 font-semibold">
                Aucune notification
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((n) => {
                  const isRead = Boolean(n?.isRead)
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!isRead) await markRead(n.id)
                          setOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 transition-all ${
                          isRead ? 'bg-white hover:bg-gray-50' : 'bg-[#0052CC]/5 hover:bg-[#0052CC]/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1.5 w-2 h-2 rounded-full ${isRead ? 'bg-gray-200' : 'bg-[#0052CC]'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-black text-sm text-slate-900 truncate">{n.title}</div>
                              <div className="text-[11px] font-bold text-gray-400 shrink-0">{formatDate(n.createdAt)}</div>
                            </div>
                            <div className="text-xs font-semibold text-gray-600 truncate">{n.message}</div>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
