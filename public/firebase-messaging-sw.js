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
      const title = payload?.notification?.title || 'Notification'
      const body = payload?.notification?.body || ''
      const data = payload?.data || {}
      self.registration.showNotification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        data,
      })
    })

    self.addEventListener('notificationclick', (event) => {
      event.notification.close()
      const url = event.notification?.data?.url
      if (!url || typeof url !== 'string') return
      event.waitUntil(
        self.clients
          .matchAll({ type: 'window', includeUncontrolled: true })
          .then((clientsArr) => {
            for (const c of clientsArr) {
              if ('focus' in c) {
                c.postMessage({ type: 'NAVIGATE', url })
                return c.focus()
              }
            }
            return self.clients.openWindow(url)
          }),
      )
    })
  } catch {}
})
