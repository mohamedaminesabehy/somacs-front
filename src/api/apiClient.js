export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function getAuthToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('auth_token')
}

function decodeJwtPayload(token) {
  if (typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const decoder = typeof window !== 'undefined' ? window.atob : globalThis.atob
    if (typeof decoder !== 'function') return null
    return JSON.parse(decoder(padded))
  } catch {
    return null
  }
}

export function isAuthTokenUsable(token) {
  if (typeof token !== 'string' || token.trim() === '') return false
  const payload = decodeJwtPayload(token.trim())
  if (!payload) return true

  const expiresAt = Number(payload.exp)
  if (!Number.isFinite(expiresAt)) return true
  return expiresAt * 1000 > Date.now() + 30_000
}

function clearStoredAuth() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem('auth_token')
    window.localStorage.removeItem('auth_user')
  } catch {
    // Storage access can fail in restricted browser contexts.
  }
}

function dispatchAuthInvalid(reason) {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('auth:invalid', { detail: { reason } }))
  } catch {
    // Ignore browsers that block CustomEvent dispatch in this context.
  }
}

function createUnauthorizedResponse(message = 'Unauthorized') {
  return new Response(null, {
    status: 401,
    statusText: message,
  })
}

function applyAuthHeader(finalHeaders) {
  const token = getAuthToken()
  if (!token) {
    return createUnauthorizedResponse('Missing authorization token')
  }
  if (!isAuthTokenUsable(token)) {
    clearStoredAuth()
    dispatchAuthInvalid('expired-token')
    return createUnauthorizedResponse('Expired authorization token')
  }
  finalHeaders.Authorization = `Bearer ${token}`
  return null
}

function prepareRequestBody(body, finalHeaders) {
  if (body === undefined || body === null || typeof body !== 'object' || body instanceof FormData) {
    return body
  }
  finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json'
  return JSON.stringify(body)
}

function createTimeoutSignal(signal, timeoutMs) {
  const timeoutController = new AbortController()
  const timeoutId = timeoutMs > 0
    ? setTimeout(() => timeoutController.abort(new DOMException('Request timeout', 'TimeoutError')), timeoutMs)
    : null
  let externalAbortHandler = null

  if (signal?.aborted) {
    timeoutController.abort(signal.reason)
  } else if (signal) {
    externalAbortHandler = () => timeoutController.abort(signal.reason)
    signal.addEventListener('abort', externalAbortHandler, { once: true })
  }

  return {
    signal: timeoutController.signal,
    cleanup() {
      if (timeoutId) clearTimeout(timeoutId)
      if (signal && externalAbortHandler) {
        signal.removeEventListener('abort', externalAbortHandler)
      }
    },
  }
}

export async function apiFetch(path, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    auth = true,
    signal,
    timeoutMs = 25_000, // timeout par défaut côté client
    ...rest
  } = options

  const finalHeaders = { ...headers }
  if (auth) {
    const unauthorizedResponse = applyAuthHeader(finalHeaders)
    if (unauthorizedResponse) return unauthorizedResponse
  }

  const finalBody = prepareRequestBody(body, finalHeaders)

  // Timeout client : si le backend met plus de N ms, on annule la requête
  // pour ne JAMAIS laisser un loader bloqué côté UI.
  const timeoutSignal = createTimeoutSignal(signal, timeoutMs)

  // On compose le signal externe (si fourni) avec le signal de timeout.

  try {
    const response = await fetch(API_BASE_URL + path, {
      method,
      headers: finalHeaders,
      body: finalBody,
      signal: timeoutSignal.signal,
      ...rest,
    })

    if (auth && response.status === 401) {
      clearStoredAuth()
      dispatchAuthInvalid('unauthorized-response')
    }

    return response
  } finally {
    timeoutSignal.cleanup()
  }
}

export async function logoutSession() {
  try {
    await apiFetch('/auth/logout', { method: 'POST', auth: true })
  } catch {
    // Local cleanup is handled by the caller even if API logout fails.
  }
}
