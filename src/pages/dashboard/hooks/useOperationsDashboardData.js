import { useEffect, useState } from 'react'
import { apiFetch } from '../../../api/apiClient'
import { fetchDevisTotals } from '../../../api/devisSuiviApi'

// ─── Response parsing helper ──────────────────────────────────────────────────

async function readArray(result, isPaginated = false) {
  if (result.status !== 'fulfilled') return []
  const response = result.value
  if (!response?.ok) return []
  try {
    const payload = await response.json()
    if (isPaginated) return Array.isArray(payload?.data) ? payload.data : []
    return Array.isArray(payload) ? payload : []
  } catch {
    return []
  }
}

/**
 * Loads all dashboard data sources (users, missions, interventions, machines, devis)
 * and the monthly devis totals.
 */
export function useOperationsDashboardData({ selectedMonth, selectedYear }) {
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [missions, setMissions] = useState([])
  const [interventions, setInterventions] = useState([])
  const [machines, setMachines] = useState([])
  const [devis, setDevis] = useState([])
  const [devisTotals, setDevisTotals] = useState({ total: 0, valides: 0, enAttente: 0, nonValides: 0 })

  useEffect(() => {
    let cancelled = false
    const loadAll = async () => {
      setIsLoading(true)
      const results = await Promise.allSettled([
        apiFetch('/users', { auth: true }),
        apiFetch('/missions', { auth: true }),
        apiFetch('/interventions/summary', { auth: true }),
        apiFetch('/machines/summary', { auth: true }),
        apiFetch('/devis?page=1&limit=200', { auth: true }),
      ])
      if (cancelled) return
      const [usersRes, missionsRes, interventionsRes, machinesRes, devisRes] = results
      const [nextUsers, nextMissions, nextInterventions, nextMachines, nextDevis] = await Promise.all([
        readArray(usersRes),
        readArray(missionsRes),
        readArray(interventionsRes),
        readArray(machinesRes),
        readArray(devisRes, true),
      ])
      if (cancelled) return
      setUsers(nextUsers)
      setMissions(nextMissions)
      setInterventions(nextInterventions)
      setMachines(nextMachines)
      setDevis(nextDevis)
      setIsLoading(false)
    }
    loadAll()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchDevisTotals(selectedMonth + 1, selectedYear)
      .then((data) => { if (!cancelled) setDevisTotals(data) })
      .catch(() => { /* non bloquant */ })
    return () => { cancelled = true }
  }, [selectedMonth, selectedYear])

  return { isLoading, users, missions, interventions, machines, devis, devisTotals }
}
