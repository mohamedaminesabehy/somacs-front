import { apiFetch } from './apiClient'

async function readJsonResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload?.message || fallbackMessage || `Erreur HTTP ${response.status}`
    throw new Error(Array.isArray(message) ? message.join(', ') : message)
  }
  return payload
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })
  return searchParams.toString()
}

export async function fetchDevisTotals(month, year) {
  const query = buildQuery({ month, year })
  const response = await apiFetch(`/devis-suivi/totals?${query}`, { auth: true })
  return readJsonResponse(response, 'Impossible de charger les totaux devis.')
}

export async function fetchDevisSuiviList(params, signal) {
  const query = buildQuery(params ?? {})
  const path = query ? `/devis-suivi?${query}` : '/devis-suivi'
  const response = await apiFetch(path, { auth: true, signal })
  return readJsonResponse(response, 'Impossible de charger la liste de suivi.')
}

export async function fetchDevisSuivi(numeroDevis, typDoc) {
  const query = buildQuery({ numeroDevis, typDoc })
  const response = await apiFetch(`/devis-suivi/by-devis?${query}`, { auth: true })
  return readJsonResponse(response, 'Impossible de charger le suivi du devis.')
}

export async function createDevisSuivi(payload) {
  const response = await apiFetch('/devis-suivi', {
    method: 'POST',
    auth: true,
    body: payload,
  })
  return readJsonResponse(response, 'Impossible de sauvegarder le suivi.')
}

export async function updateDevisSuiviStatus(payload) {
  const response = await apiFetch('/devis-suivi/status', {
    method: 'PATCH',
    auth: true,
    body: payload,
  })
  return readJsonResponse(response, 'Impossible de mettre à jour le statut.')
}

export async function updateDevisSuiviNote(payload) {
  const response = await apiFetch('/devis-suivi/note', {
    method: 'PATCH',
    auth: true,
    body: payload,
  })
  return readJsonResponse(response, 'Impossible de mettre à jour la note.')
}

export async function updateDevisSuiviRefusalReason(payload) {
  const response = await apiFetch('/devis-suivi/refusal-reason', {
    method: 'PATCH',
    auth: true,
    body: payload,
  })
  return readJsonResponse(response, 'Impossible de mettre à jour la raison du refus.')
}

export async function updateDevisSuiviReminder(payload) {
  const response = await apiFetch('/devis-suivi/reminder', {
    method: 'PATCH',
    auth: true,
    body: payload,
  })
  return readJsonResponse(response, 'Impossible de mettre à jour le rappel.')
}

export async function fetchDevisSuiviRelancesToday(signal) {
  const response = await apiFetch('/devis-suivi/relance/today', { auth: true, signal })
  return readJsonResponse(response, 'Impossible de charger les relances du jour.')
}

export async function fetchDevisSuiviRelancesOverdue(signal) {
  const response = await apiFetch('/devis-suivi/relance/overdue', { auth: true, signal })
  return readJsonResponse(response, 'Impossible de charger les relances en retard.')
}

export async function fetchDevisSuiviStats(signal) {
  const response = await apiFetch('/devis-suivi/stats', { auth: true, signal })
  return readJsonResponse(response, 'Impossible de charger les statistiques.')
}

export async function markDevisPurchased(id) {
  const response = await apiFetch(`/devis-suivi/${id}/mark-purchased`, {
    method: 'PATCH',
    auth: true,
  })
  return readJsonResponse(response, 'Impossible de marquer comme acheté.')
}

export async function markDevisLost(id, reasonRefusal, refusalReasonCode) {
  const response = await apiFetch(`/devis-suivi/${id}/mark-lost`, {
    method: 'PATCH',
    auth: true,
    body: {
      reasonRefusal: reasonRefusal || '',
      refusalReasonCode: refusalReasonCode || undefined,
    },
  })
  return readJsonResponse(response, 'Impossible de marquer comme perdu.')
}

export async function fetchDevisSuiviById(id) {
  const response = await apiFetch(`/devis-suivi/${id}`, { auth: true })
  return readJsonResponse(response, 'Impossible de charger le suivi.')
}


export async function fetchDevisSuiviStatuses(numeros, signal) {
  const safeNumeros = numeros ?? []
  if (!safeNumeros.length) return {}
  const query = safeNumeros.join(',')
  const response = await apiFetch(`/devis-suivi/statuses?numeros=${encodeURIComponent(query)}`, { auth: true, signal })
  return readJsonResponse(response, 'Impossible de charger les statuts.')
}

export async function triggerMarkExpired() {
  const response = await apiFetch('/devis-suivi/mark-expired', {
    method: 'PATCH',
    auth: true,
  })
  return readJsonResponse(response, 'Impossible de marquer les devis expirés.')
}
