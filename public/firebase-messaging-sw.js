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

    const title = payload?.notification?.title || 'Notification'
    const body = payload?.notification?.body || ''
    const data = payload?.data || {}

    return self.registration.showNotification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: data.notificationId || 'notification',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data,
    })
  })
} catch (err) {
  console.error('[SW] Firebase init error:', err)
}

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification)
  event.notification.close()

  const data = event.notification?.data || {}
  const url = data.url || '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientsArr) => {
        for (const c of clientsArr) {
          if (c.url.includes(self.registration.scope) && 'focus' in c) {
            c.postMessage({ type: 'NAVIGATE', url })
            return c.focus()
          }
        }
        return self.clients.openWindow(url)
      }),
  )
})
