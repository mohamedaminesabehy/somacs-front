/**
 * Utilitaires de formatage partagés (montants, nombres, texte).
 * Centralise les fonctions auparavant dupliquées dans plusieurs pages.
 */

/**
 * Formate un montant en devise (TND par défaut), style monétaire complet.
 * Ex: 1234.5 -> "1 234,500 TND"
 */
export function formatCurrency(amount, currency = 'TND') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(Number(amount) || 0)
}

/** Alias historique : certaines pages utilisaient formatMoney / fmtMoney. */
export const formatMoney = formatCurrency

/**
 * Formate un nombre décimal (sans symbole monétaire).
 * Par défaut 3 décimales, comme utilisé sur les fiches devis.
 */
export function formatPrice(amount, minimumFractionDigits = 3, maximumFractionDigits = 3) {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Number(amount) || 0)
}

/** Initiales à partir d'un nom complet. Ex: "Jean Dupont" -> "JD". */
export function getAvatarFromName(name) {
  if (!name) return ''
  const parts = String(name).split(' ').filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

/** Normalise une chaîne (minuscules, sans accents) pour recherche/comparaison. */
export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}
