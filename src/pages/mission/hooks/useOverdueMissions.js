import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../../api/apiClient'

export const OVERDUE_PAGE_SIZE = 20

const EMPTY = { ids: new Set(), groupIds: new Set(), total: 0, totalPages: 1, loading: true, error: '' }

function buildQuery({ page, limit, search, priority, type, employee, dateFrom, dateTo }) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) params.set('search', search)
  if (priority && priority !== 'all') params.set('priority', priority)
  if (type && type !== 'all') params.set('type', type)
  if (employee && employee !== 'all') params.set('employee', employee)
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)
  return params.toString()
}

/**
 * Missions en retard, paginées côté backend (/sav/missions/overdue).
 * Même règle que le Dashboard et le Pilotage SAV (fuseau Africa/Tunis) :
 * aucune limite arbitraire côté client, le compteur est le `total` du serveur.
 * Quand l'onglet n'est pas actif, on ne demande qu'une ligne pour obtenir le total.
 */
export function useOverdueMissions({ active, page, filters, refreshKey }) {
  const [state, setState] = useState(EMPTY)
  const { search, priority, type, employee, dateFrom, dateTo } = filters
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const query = useMemo(
    () => buildQuery({
      page: active ? page : 1,
      limit: active ? OVERDUE_PAGE_SIZE : 1,
      search: debouncedSearch.trim(),
      priority, type, employee, dateFrom, dateTo,
    }),
    [active, page, debouncedSearch, priority, type, employee, dateFrom, dateTo],
  )

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await apiFetch(`/sav/missions/overdue?${query}`, { auth: true, noCache: true })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body = await res.json()
        if (cancelled) return
        const rows = Array.isArray(body?.data) ? body.data : []
        setState({
          ids: new Set(rows.map((m) => Number(m.id))),
          groupIds: new Set(rows.map((m) => m.assignmentGroupId).filter(Boolean).map(String)),
          total: Number(body?.total) || 0,
          totalPages: Math.max(1, Number(body?.totalPages) || 1),
          loading: false,
          error: '',
        })
      } catch {
        if (!cancelled) setState({ ...EMPTY, loading: false, error: 'Impossible de charger les missions en retard.' })
      }
    }
    load()
    return () => { cancelled = true }
  }, [query, refreshKey])

  return state
}
