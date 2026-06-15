/**
 * Utilitaires de rôles partagés (frontend).
 * Le contrôle d'accès réel est appliqué côté backend ; ces helpers servent
 * uniquement à l'affichage / routage côté client.
 */

/** Normalise un rôle : minuscules, sans accents. */
export function normalizeRole(role) {
  return String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export const ROLE = {
  ADMIN: 'administrateur',
  TECHNICIEN: 'technicien',
  COMMERCIALE: 'commerciale',
  COORDINATEUR: 'coordinateur',
  RESPONSABLE_TECHNICIEN: 'responsable technicien',
}

/** True si le rôle (brut ou normalisé) correspond à l'un des rôles attendus. */
export function hasRole(role, ...expected) {
  const r = normalizeRole(role)
  return expected.map(normalizeRole).includes(r)
}

export function isAdmin(role) {
  return normalizeRole(role) === ROLE.ADMIN
}

export function isTechnicien(role) {
  return normalizeRole(role) === ROLE.TECHNICIEN
}
