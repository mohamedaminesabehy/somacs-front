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

try {
  firebase.initializeApp(firebaseConfig)
  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload)

    // If payload contains `notification`, Firebase SDK already shows
    // the system notification automatically. Do NOT show it again manually.
    if (payload?.notification) {
      console.log('[SW] Notification payload present — skipping manual display (handled by Firebase SDK)')
      return
    }

    // Data-only messages: show notification manually
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
  // Always navigate to the notification-aware mission URL
  const missionUrl = missionId ? `/missions/${missionId}/notification` : '/'

  console.log('[SW] missionId:', missionId, '| target:', missionUrl)

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientsArr) => {
        for (const client of clientsArr) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', url: missionUrl, missionId })
            return client.focus()
          }
        }
        const base = self.registration.scope.replace(/\/$/, '')
        return self.clients.openWindow(base + missionUrl)
      }),
  )
})
