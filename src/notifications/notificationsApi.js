import { apiFetch } from '../api/apiClient'

export async function fetchNotifications(limit = 30) {
  const res = await apiFetch(`/notifications?limit=${encodeURIComponent(limit)}`, {
    method: 'GET',
    auth: true,
  })
  if (!res.ok) return []
  const data = await res.json().catch(() => [])
  return Array.isArray(data) ? data : []
}

export async function fetchUnreadCount() {
  const res = await apiFetch('/notifications/unread-count', {
    method: 'GET',
    auth: true,
  })
  if (!res.ok) return 0
  const data = await res.json().catch(() => null)
  const count = data && typeof data.count === 'number' ? data.count : 0
  return count
}

export async function markNotificationRead(id) {
  const res = await apiFetch(`/notifications/${id}/read`, {
    method: 'PATCH',
    auth: true,
  })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

export async function markAllNotificationsRead() {
  const res = await apiFetch('/notifications/read-all', {
    method: 'PATCH',
    auth: true,
  })
  return res.ok
}
