export function dateKey(value) {
  const key = String(value || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null
  const date = new Date(`${key}T12:00:00Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== key ? null : key
}

export function shiftCalendarDate(key, view, direction) {
  const date = new Date(`${key}T12:00:00Z`)
  if (view === 'month') {
    const day = date.getUTCDate()
    date.setUTCDate(1)
    date.setUTCMonth(date.getUTCMonth() + direction)
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
    date.setUTCDate(Math.min(day, lastDay))
  } else date.setUTCDate(date.getUTCDate() + direction * (view === 'week' ? 7 : 1))
  return date.toISOString().slice(0, 10)
}

export function calendarDays(key, view) {
  if (view === 'day') return [key]
  const first = new Date(`${key}T12:00:00Z`)
  if (view === 'month') first.setUTCDate(1)
  first.setUTCDate(first.getUTCDate() - (first.getUTCDay() + 6) % 7)
  const last = new Date(`${key}T12:00:00Z`)
  if (view === 'month') {
    last.setUTCMonth(last.getUTCMonth() + 1, 0)
    last.setUTCDate(last.getUTCDate() + (7 - last.getUTCDay()) % 7)
  } else {
    last.setTime(first.getTime())
    last.setUTCDate(last.getUTCDate() + 6)
  }
  const days = []
  for (const date = new Date(first); date <= last; date.setUTCDate(date.getUTCDate() + 1)) days.push(date.toISOString().slice(0, 10))
  return days
}
