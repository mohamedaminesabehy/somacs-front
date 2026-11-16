export const VEHICLE_RELEASE_ROLES = new Set(['Administrateur', 'Responsable technicien'])

export function getStoredAuthUser() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(window.localStorage.getItem('auth_user') || 'null')
  } catch {
    return null
  }
}
