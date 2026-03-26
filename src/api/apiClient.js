export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function getAuthToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('auth_token')
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
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`
    }
  }

  let finalBody = body
  if (body !== undefined && body !== null && typeof body === 'object' && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json'
    finalBody = JSON.stringify(body)
  }

  return fetch(API_BASE_URL + path, {
    method,
    headers: finalHeaders,
    body: finalBody,
    ...rest,
  })
}

