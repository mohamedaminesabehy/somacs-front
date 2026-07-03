/* global importScripts, firebase */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: 'AIzaSyAZO4aEk2MsiwURyzuuhzJjOGe34trIuEM',
  authDomain: 'somacs-notifications.firebaseapp.com',
  projectId: 'somacs-notifications',
  storageBucket: 'somacs-notifications.firebasestorage.app',
  messagingSenderId: '880227586325',
  appId: '1:880227586325:web:0d537ac11c6c16b472d91c',
}

// ── IndexedDB helper (accessible from Service Worker) ─────────────────────────
const IDB_NAME = 'somacs_notifications'
const IDB_STORE = 'pending'
const IDB_KEY = 'pending_notification_url'

function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function savePendingUrl(url) {
  return openIDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      const store = tx.objectStore(IDB_STORE)
      store.put({ url, timestamp: Date.now() }, IDB_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }).catch((err) => {
    console.warn('[SW] IndexedDB savePendingUrl failed:', err)
  })
}

// ── Firebase init ─────────────────────────────────────────────────────────────
try {
  firebase.initializeApp(firebaseConfig)
  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload)

    if (payload?.notification) {
      console.log('[SW] Notification payload present — skipping manual display')
      return
    }

    const title = payload?.data?.title || 'Notification'
    const body = payload?.data?.body || ''
    const data = payload?.data || {}

    return self.registration.showNotification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: data.notificationId || `notification-${Date.now()}`,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data,
    })
  })
} catch (err) {
  console.error('[SW] Firebase init error:', err)
}

// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification)
  event.notification.close()

  const data = event.notification?.data || {}
  const missionId = data.missionId || ''
  const missionUrl = missionId ? `/missions/${missionId}/notification` : '/'

  console.log('[SW] missionId:', missionId, '| target:', missionUrl)

  event.waitUntil(
    // STEP 1: Persist the target URL in IndexedDB (accessible from main thread)
    savePendingUrl(missionUrl).then(() => {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    }).then((clientsArr) => {
      // STEP 2: If PWA window exists, send message and focus
      for (const client of clientsArr) {
        if ('focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', url: missionUrl, missionId })
          return client.focus()
        }
      }
      // STEP 3: No window — open the PWA. Even if Android ignores the path,
      // App.jsx will read the pending URL from IndexedDB on startup.
      const origin = self.location.origin
      return self.clients.openWindow(origin + missionUrl)
    }),
  )
})
