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
  return data && typeof data.count === 'number' ? data.count : 0
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

// ── Notification Center (paginated / filtered) ──
export async function fetchNotificationCenter({
  page = 1,
  limit = 20,
  search = '',
  status = 'all',
  archived = false,
  dateFrom = '',
  dateTo = '',
  order = 'DESC',
} = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (search) params.set('search', search)
  if (status && status !== 'all') params.set('status', status)
  if (archived) params.set('archived', 'true')
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)
  if (order) params.set('order', order)

  const res = await apiFetch(`/notifications/center?${params.toString()}`, {
    method: 'GET',
    auth: true,
  })
  if (!res.ok) {
    return { data: [], total: 0, page, limit, totalPages: 1 }
  }
  const json = await res.json().catch(() => null)
  if (!json || !Array.isArray(json.data)) {
    return { data: [], total: 0, page, limit, totalPages: 1 }
  }
  return json
}

export async function deleteNotification(id) {
  const res = await apiFetch(`/notifications/${id}`, {
    method: 'DELETE',
    auth: true,
  })
  return res.ok
}

export async function deleteNotifications(ids) {
  const res = await apiFetch('/notifications/delete-many', {
    method: 'POST',
    auth: true,
    body: { ids },
  })
  if (!res.ok) return 0
  const json = await res.json().catch(() => null)
  return json && typeof json.deleted === 'number' ? json.deleted : 0
}

export async function archiveNotification(id, archived = true) {
  const res = await apiFetch(`/notifications/${id}/archive`, {
    method: 'PATCH',
    auth: true,
    body: { archived },
  })
  if (!res.ok) return null
  return res.json().catch(() => null)
}
