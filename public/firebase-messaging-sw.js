importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

async function loadConfig() {
  try {
    const res = await fetch('/firebase-config.json', { cache: 'no-store' })
    if (!res.ok) return null
    const cfg = await res.json()
    if (!cfg || !cfg.apiKey || !cfg.projectId || !cfg.messagingSenderId || !cfg.appId) return null
    return cfg
  } catch {
    return null
  }
}

loadConfig().then((cfg) => {
  if (!cfg) return
  try {
    firebase.initializeApp(cfg)
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
  } catch (err) {
    console.error('[SW] Firebase init error:', err)
  }
})
