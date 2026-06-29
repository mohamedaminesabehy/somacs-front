/**
 * Utilitaires de date partagés.
 * Centralise le formatage et le parsing auparavant dupliqués.
 */

/**
 * Formate une date courte FR : "JJ/MM/AAAA".
 * Retourne "-" si la valeur est absente ou invalide.
 */
export function formatDate(value) {
  if (!value) return '-'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formate une date avec heure : "JJ/MM/AAAA HH:mm".
 * Retourne "-" si la valeur est absente ou invalide.
 */
export function formatDateTime(value) {
  if (!value) return '-'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Parse une valeur de date tolérante (Date, ISO, "JJ/MM/AAAA", "Aujourd'hui").
 * Retourne un objet Date ou null.
 */
export function parseDateLike(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  const raw = String(value).trim()
  if (!raw) return null
  if (raw.toLowerCase() === "aujourd'hui") return new Date()
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('/').map(Number)
    const built = new Date(y, m - 1, d)
    if (!Number.isNaN(built.getTime())) return built
  }
  return null
}

export function relativeDateLabel(value, emptyLabel = 'Date non prÃ©cisÃ©e') {
  const date = parseDateLike(value)
  if (!date) return emptyLabel
  const today = new Date()
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Hier'
  if (diff > 1 && diff <= 30) return `Il y a ${diff} jours`
  if (diff < 0 && Math.abs(diff) <= 30) return `Dans ${Math.abs(diff)} jours`
  return formatDate(date)
}

export function isSameMonthYear(date, month, year) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false
  return date.getMonth() === month && date.getFullYear() === year
}

/** Date du jour au format input HTML (yyyy-MM-dd), en heure locale. */
export function todayInputDate() {
  return new Date().toLocaleDateString('en-CA')
}
