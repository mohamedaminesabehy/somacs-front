export const ROLE_TECHNICIEN = 'technicien'

export function normalizeRole(user) {
  return String(user?.role || '').trim().toLowerCase()
}

export function readStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(window.localStorage.getItem('auth_user') || 'null')
  } catch {
    return null
  }
}

export function formatMissionRef(id) {
  return `MIS-${String(id ?? '').padStart(4, '0')}`
}

export function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function formatLongDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** Team from the API (`team`), falling back to the legacy display string. */
export function buildTeamMembers(mission, groupedEmployeesDisplay) {
  if (Array.isArray(mission?.team) && mission.team.length > 0) {
    return mission.team.map((member) => ({
      key: String(member.userId ?? member.name),
      userId: member.userId ?? null,
      name: member.name || 'Technicien',
      isDriver: Boolean(member.isDriver),
    }))
  }
  return String(groupedEmployeesDisplay || mission?.employee || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ key: name, userId: null, name, isDriver: false }))
}

export const NEXT_STEP_BY_STATUS = {
  'À faire': {
    title: 'Démarrer la mission',
    hint: 'Passez la mission en cours dès votre arrivée sur site.',
    next: 'En cours',
    cta: 'Démarrer la mission',
  },
  'En cours': {
    title: 'Mission en cours',
    hint: 'Renseignez l’intervention, puis terminez la mission une fois le travail réalisé.',
    next: 'Terminée',
    cta: 'Terminer la mission',
  },
  'Bloquée': {
    title: 'Mission bloquée',
    hint: 'Reprenez la mission lorsque le blocage est levé.',
    next: 'En cours',
    cta: 'Reprendre la mission',
  },
  'Terminée': {
    title: 'Mission terminée',
    hint: 'Aucune action requise. Vous pouvez encore compléter vos notes.',
    next: null,
    cta: null,
  },
}

export function downloadDocument(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'document'
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
