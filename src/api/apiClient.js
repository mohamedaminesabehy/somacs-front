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
  } catch {}
}

function dispatchAuthInvalid(reason) {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('auth:invalid', { detail: { reason } }))
  } catch {}
}

function createUnauthorizedResponse(message = 'Unauthorized') {
  return new Response(null, {
    status: 401,
    statusText: message,
  })
}

export async function apiFetch(path, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    auth = true,
    ...rest
  } = options

  const finalHeaders = { ...headers }
  if (auth) {
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
  }

  let finalBody = body
  if (body !== undefined && body !== null && typeof body === 'object' && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json'
    finalBody = JSON.stringify(body)
  }

  const response = await fetch(API_BASE_URL + path, {
    method,
    headers: finalHeaders,
    body: finalBody,
    ...rest,
  })

  if (auth && response.status === 401) {
    clearStoredAuth()
    dispatchAuthInvalid('unauthorized-response')
  }

  return response
}

