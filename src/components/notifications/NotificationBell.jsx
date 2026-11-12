import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../notifications/NotificationsProvider'

function formatTime(value) {
  try {
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function getDateGroupLabel(value) {
  try {
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return 'Autre'
    const today = new Date()
    const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
    if (isToday) return "Aujourd'hui"
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear()
    if (isYesterday) return 'Hier'
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return 'Autre'
  }
}

function getDateKey(value) {
  try {
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return 'unknown'
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return 'unknown'
  }
}

function groupNotificationsByDate(items) {
  const groups = []
  const map = new Map()
  for (const n of items) {
    const key = getDateKey(n.createdAt)
    if (!map.has(key)) {
      const group = { key, label: getDateGroupLabel(n.createdAt), items: [] }
      map.set(key, group)
      groups.push(group)
    }
    map.get(key).items.push(n)
  }
  return groups
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, enablePushNotifications } = useNotifications()
  const [open, setOpen] = useState(false)
  const [pushState, setPushState] = useState({ status: 'idle', message: '' })
  const rootRef = useRef(null)
  const navigate = useNavigate()

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

  function getMissionIdFromNotification(n) {
    if (!n) return null
    if (typeof n.missionId === 'number') return n.missionId
    const text = [n.message, n.title].filter(Boolean).join(' ')
    if (typeof text !== 'string' || text.trim() === '') return null
    const patterns = [/MIS-?(\d+)/i, /mission[^0-9]*?(\d+)/i, /id[^0-9]*?(\d+)/i]
    for (const re of patterns) {
      const m = text.match(re)
      if (m && m[1] && !Number.isNaN(Number(m[1]))) return Number(m[1])
    }
    return null
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative text-gray-500 hover:text-brand-600 p-2 hover:bg-brand-600/5 rounded-xl transition-all"
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
        <>
          <button
            type="button"
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Fermer les notifications"
          />
          <div className="fixed inset-x-0 bottom-0 md:absolute md:inset-x-auto md:right-0 md:bottom-auto md:top-full md:mt-3 w-full md:w-[360px] bg-white border border-gray-200 rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col max-h-[80vh] md:max-h-[calc(100vh-8rem)]">
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
                  : 'text-brand-600 border-brand-600/20 bg-brand-600/5 hover:bg-brand-600/10'
              }`}
            >
              Tout lire
            </button>
          </div>

          {permission && permission !== 'granted' && (
            <div className="px-4 py-3 border-b border-gray-100 bg-amber-50/40">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-amber-900">
                  Activez les notifications push pour recevoir les missions en arriÃ¨re-plan.
                  {pushState.status === 'error' && (
                    <div className="mt-1 text-[11px] font-bold text-red-700">{pushState.message}</div>
                  )}
                  {pushState.status === 'enabled' && (
                    <div className="mt-1 text-[11px] font-bold text-emerald-700">{pushState.message}</div>
                  )}
                  {pushState.status === 'loading' && (
                    <div className="mt-1 text-[11px] font-bold text-amber-900">Activation en coursâ€¦</div>
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
                        message: 'Notifications activÃ©es.',
                      })
                      return
                    }
                    const reason = res?.reason || 'unknown'
                    const reasonMessages = {
                      unsupported: "Votre navigateur ne supporte pas les notifications push.",
                      'permission-denied': "Autorisation refus\u00e9e. Activez-la dans les r\u00e9glages du navigateur.",
                      'missing-vapid': "Configuration VAPID manquante c\u00f4t\u00e9 frontend.",
                      'missing-config': "Configuration Firebase manquante c\u00f4t\u00e9 frontend.",
                      'sw-failed': "Service Worker non install\u00e9 (HTTPS requis, ou blocage navigateur).",
                      'token-failed': "Impossible d'obtenir le token push (Firebase).",
                      unauthorized: "Session expir\u00e9e. Reconnectez-vous puis r\u00e9essayez.",
                    }
                    const msg = reasonMessages[reason] || "\u00c9chec d'activation. Ouvrez la console pour plus de d\u00e9tails."
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

          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500 font-semibold">
                Aucune notification
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {groupNotificationsByDate(items).map((group) => (
                  <div key={group.key}>
                    <div className="sticky top-0 z-10 px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{group.label}</span>
                    </div>
                    <ul>
                      {group.items.map((n) => {
                        const isRead = Boolean(n?.isRead)
                        return (
                          <li key={n.id} className="border-b border-gray-50 last:border-b-0">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  if (!isRead) await markRead(n.id)
                                  const missionId = getMissionIdFromNotification(n)
                                  if (missionId) {
                                    navigate(`/missions/${missionId}`)
                                  }
                                } finally {
                                  setOpen(false)
                                }
                              }}
                              className={`w-full text-left px-4 py-3 transition-all ${
                                isRead ? 'bg-white hover:bg-gray-50' : 'bg-brand-600/5 hover:bg-brand-600/10'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${isRead ? 'bg-gray-200' : 'bg-brand-600'}`} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="font-black text-sm text-slate-900 leading-snug line-clamp-2">{n.title}</div>
                                    <div className="text-[10px] font-bold text-gray-400 shrink-0 whitespace-nowrap">{formatTime(n.createdAt)}</div>
                                  </div>
                                  <div className="text-xs font-semibold text-gray-600 mt-0.5 line-clamp-2">{n.message}</div>
                                </div>
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </>
      )}
    </div>
  )
}
