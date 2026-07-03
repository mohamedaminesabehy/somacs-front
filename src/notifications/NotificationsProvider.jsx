import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { API_BASE_URL, getAuthToken, isAuthTokenUsable } from '../api/apiClient'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './notificationsApi'
import { onForegroundMessage, registerFcmToken } from './firebaseMessaging'

const NotificationsContext = createContext(null)
const noop = () => { /* no-op */ }

function playNotificationSound() {
  if (typeof window === 'undefined') return
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.04
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.12)
    osc.onended = () => {
      try {
        ctx.close()
      } catch {
        // Ignore audio context cleanup failures.
      }
    }
  } catch {
    // Notification sound is optional.
  }
}

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState(null)
  const socketRef = useRef(null)
  const toastTimerRef = useRef(null)
  const navigateRef = useRef(null)

  // Keep a ref to the navigate function for use in event handlers
  const navigate = useNavigate()
  useEffect(() => { navigateRef.current = navigate }, [navigate])

  // Navigation from notification click (SW posts message)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (event) => {
      const { type, url, missionId } = event.data || {}
      if (type !== 'NOTIFICATION_CLICK') return
      console.log('[Notifications] SW click received — url:', url, 'missionId:', missionId)

      // Always navigate to the notification-aware mission page.
      // MissionDetails handles auth internally (shows login modal if needed).
      const target = missionId ? `/missions/${missionId}/notification` : (url || '/')
      console.log('[Notifications] Navigating to:', target)
      if (navigateRef.current) {
        navigateRef.current(target)
      } else {
        window.location.href = target
      }
    }
    navigator.serviceWorker?.addEventListener('message', handler)
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [])

  const refresh = useCallback(async () => {
    const [items, count] = await Promise.all([fetchNotifications(30), fetchUnreadCount()])
    setNotifications(items)
    setUnreadCount(count)
  }, [])

  const markRead = useCallback(
    async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n && n.id === id ? { ...n, isRead: true } : n)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    const updated = await markNotificationRead(id)
    if (!updated) {
      await refresh()
    }
    },
    [refresh],
  )

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => (n ? { ...n, isRead: true } : n)))
    setUnreadCount(0)
    const ok = await markAllNotificationsRead()
    if (!ok) {
      await refresh()
    }
  }, [refresh])

  const enablePushNotifications = useCallback(async () => {
    return registerFcmToken()
  }, [])

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    if (!isAuthTokenUsable(token)) {
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('auth:invalid', { detail: { reason: 'expired-token' } }))
        } catch {
          // Ignore event dispatch failures in constrained browsers.
        }
      }
      return
    }

    refresh()
    
    // Demander les permissions de notification dès la connexion
    if (typeof window !== 'undefined' && typeof window.Notification !== 'undefined') {
      if (window.Notification.permission === 'default') {
        // Demander la permission automatiquement
        window.Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            registerFcmToken()
          }
        }).catch(() => {
          // Permission refusée, on continue sans notifications push
        })
      } else if (window.Notification.permission === 'granted') {
        registerFcmToken()
      }
    }

    const socket = io(API_BASE_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      refresh()
    })
    socket.on('reconnect', () => {
      refresh()
    })
    socket.on('connect_error', (error) => {
      const message = String(error?.message || error?.data?.message || '').toLowerCase()
      if (message.includes('unauthorized') || message.includes('invalid') || message.includes('forbidden')) {
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(new CustomEvent('auth:invalid', { detail: { reason: 'socket-unauthorized' } }))
          } catch {
            // Ignore event dispatch failures in constrained browsers.
          }
        }
        try {
          socket.disconnect()
        } catch {
          // Socket may already be closed.
        }
      }
    })

    socket.on('newNotification', (payload) => {
      if (!payload || typeof payload.id !== 'number') return
      setNotifications((prev) => {
        const exists = prev.some((n) => n && n.id === payload.id)
        if (exists) return prev
        return [payload, ...prev].slice(0, 60)
      })
      setUnreadCount((prev) => prev + 1)
      setToast({ id: payload.id, title: payload.title, message: payload.message })
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null)
        toastTimerRef.current = null
      }, 3500)
      playNotificationSound()
    })

    // ── Cross-device read/unread synchronization ──
    socket.on('notificationRead', (payload) => {
      const id = payload && typeof payload.id === 'number' ? payload.id : null
      if (id == null) return
      setNotifications((prev) => {
        let changed = false
        const next = prev.map((n) => {
          if (n && n.id === id && !n.isRead) {
            changed = true
            return { ...n, isRead: true }
          }
          return n
        })
        if (changed) setUnreadCount((c) => Math.max(0, c - 1))
        return next
      })
    })

    socket.on('notificationsAllRead', () => {
      setNotifications((prev) => prev.map((n) => (n ? { ...n, isRead: true } : n)))
      setUnreadCount(0)
    })

    socket.on('notificationDeleted', (payload) => {
      const id = payload && typeof payload.id === 'number' ? payload.id : null
      if (id == null) return
      setNotifications((prev) => {
        const removed = prev.find((n) => n && n.id === id)
        if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1))
        return prev.filter((n) => n && n.id !== id)
      })
    })

    socket.on('notificationsDeleted', (payload) => {
      const ids = payload && Array.isArray(payload.ids) ? payload.ids : []
      if (ids.length === 0) return
      const idSet = new Set(ids)
      setNotifications((prev) => {
        const removedUnread = prev.filter((n) => n && idSet.has(n.id) && !n.isRead).length
        if (removedUnread > 0) setUnreadCount((c) => Math.max(0, c - removedUnread))
        return prev.filter((n) => n && !idSet.has(n.id))
      })
    })

    socket.on('notificationArchived', (payload) => {
      const id = payload && typeof payload.id === 'number' ? payload.id : null
      if (id == null) return
      // Archived notifications leave the active bell list; reconcile counts.
      refresh()
    })

    let unsubscribeMessaging = noop
    ;(async () => {
      unsubscribeMessaging = await onForegroundMessage(async (payload) => {
        const id = Number(payload?.data?.notificationId)
        if (id && !Number.isNaN(id)) {
          await refresh()
          playNotificationSound()
        }
      })
    })()

    return () => {
      try {
        unsubscribeMessaging()
      } catch {
        // Messaging listener cleanup is best-effort.
      }
      try {
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      } catch {
        // Timer cleanup is best-effort during teardown.
      }
      try {
        socket.disconnect()
      } catch {
        // Socket may already be closed.
      }
      socketRef.current = null
    }
  }, [refresh])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      refresh,
      markRead,
      markAllRead,
      enablePushNotifications,
    }),
    [notifications, unreadCount, refresh, markRead, markAllRead, enablePushNotifications],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] animate-in fade-in slide-in-from-top-4">
          <div className="w-[320px] bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-2xl shadow-2xl">
            <div className="text-xs font-black uppercase tracking-wider text-slate-300">Notification</div>
            <div className="mt-1 text-sm font-black">{toast.title}</div>
            <div className="mt-0.5 text-xs font-semibold text-slate-200 truncate">{toast.message}</div>
          </div>
        </div>
      )}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    return {
      notifications: [],
      unreadCount: 0,
      refresh: async () => { /* no provider */ },
      markRead: async () => { /* no provider */ },
      markAllRead: async () => { /* no provider */ },
      enablePushNotifications: async () => ({ ok: false }),
    }
  }
  return ctx
}
