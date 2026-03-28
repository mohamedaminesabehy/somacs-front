import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { apiFetch } from '../api/apiClient'

function getFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  const appId = import.meta.env.VITE_FIREBASE_APP_ID

  if (!apiKey || !projectId || !messagingSenderId || !appId) return null
  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }
}

function getOrInitFirebaseApp() {
  const existing = getApps()
  if (existing.length > 0) return existing[0]
  const cfg = getFirebaseConfig()
  if (!cfg) return null
  return initializeApp(cfg)
}

async function getServiceWorkerRegistration() {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    return reg
  } catch {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
      return reg || null
    } catch {
      return null
    }
  }
}

export async function registerFcmToken() {
  if (typeof window === 'undefined') return { ok: false, reason: 'no-window' }

  const supported = await isSupported().catch(() => false)
  if (!supported) return { ok: false, reason: 'unsupported' }

  const app = getOrInitFirebaseApp()
  if (!app) return { ok: false, reason: 'missing-config' }

  const perm = await window.Notification.requestPermission().catch(() => 'default')
  if (perm !== 'granted') return { ok: false, reason: 'permission-denied' }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) return { ok: false, reason: 'missing-vapid' }

  const registration = await getServiceWorkerRegistration()
  if (!registration) return { ok: false, reason: 'sw-failed' }

  const messaging = getMessaging(app)
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration }).catch(() => null)
  if (!token) return { ok: false, reason: 'token-failed' }

  const res = await apiFetch('/notifications/fcm-token', {
    method: 'POST',
    auth: true,
    body: { token },
  })
  if (!res.ok) return { ok: false, reason: 'backend-failed' }

  return { ok: true, token }
}

export async function onForegroundMessage(handler) {
  const supported = await isSupported().catch(() => false)
  if (!supported) return () => {}

  const app = getOrInitFirebaseApp()
  if (!app) return () => {}

  const messaging = getMessaging(app)
  const unsubscribe = onMessage(messaging, (payload) => {
    try {
      handler(payload)
    } catch {}
  })
  return unsubscribe
}
