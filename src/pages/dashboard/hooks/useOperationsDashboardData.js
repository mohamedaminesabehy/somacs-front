import { useEffect, useState } from 'react'
import { apiFetch } from '../../../api/apiClient'

async function readArray(result) {
  if (result.status !== 'fulfilled') return []
  const response = result.value
  if (!response?.ok) return []
  try {
    const payload = await response.json()
    return Array.isArray(payload) ? payload : []
  } catch {
    return []
  }
}

/**
 * Loads all dashboard data sources (users, missions, interventions, machines)
 * in parallel, once per mount.
 */
export function useOperationsDashboardData() {
  const [state, setState] = useState({
    isLoading: true,
    users: [],
    missions: [],
    interventions: [],
    machines: [],
  })

  useEffect(() => {
    let cancelled = false
    const loadAll = async () => {
      const results = await Promise.allSettled([
        apiFetch('/users', { auth: true }),
        apiFetch('/missions', { auth: true }),
        apiFetch('/interventions/summary', { auth: true }),
        apiFetch('/machines/summary', { auth: true }),
      ])
      if (cancelled) return
      const [users, missions, interventions, machines] = await Promise.all(results.map((r) => readArray(r)))
      if (cancelled) return
      setState({ isLoading: false, users, missions, interventions, machines })
    }
    loadAll()
    return () => { cancelled = true }
  }, [])

  return state
}
