/**
 * Reads and clears the pending notification URL stored by the service worker.
 * Uses IndexedDB (same DB the SW writes to).
 * Returns the URL string or null if none/expired.
 */

const IDB_NAME = 'somacs_notifications'
const IDB_STORE = 'pending'
const IDB_KEY = 'pending_notification_url'
const MAX_AGE_MS = 10 * 60 * 1000 // 10 minutes

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

/**
 * Reads the pending notification URL, validates it, and clears it.
 * @returns {Promise<string|null>} The pending URL or null.
 */
export async function consumePendingNotificationUrl() {
  try {
    const db = await openIDB()
    const record = await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      const store = tx.objectStore(IDB_STORE)
      const getReq = store.get(IDB_KEY)
      getReq.onsuccess = () => {
        // Always delete after reading
        store.delete(IDB_KEY)
        resolve(getReq.result)
      }
      getReq.onerror = () => reject(getReq.error)
    })

    if (!record || !record.url) return null

    // Validate: must be a mission notification URL
    if (!record.url.startsWith('/missions/') || !record.url.endsWith('/notification')) {
      return null
    }

    // Validate: must not be older than 10 minutes
    if (record.timestamp && Date.now() - record.timestamp > MAX_AGE_MS) {
      return null
    }

    return record.url
  } catch {
    return null
  }
}
