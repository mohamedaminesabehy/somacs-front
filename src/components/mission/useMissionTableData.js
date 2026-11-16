import useSWR from 'swr'
import { apiFetch } from '../../api/apiClient'

const EMPTY = []
async function fetchRows(path) {
  const response = await apiFetch(path, { auth: true, noCache: true })
  if (!response.ok) throw new Error(`Chargement impossible (HTTP ${response.status}).`)
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

/** Handles data-fetching (missions, interventions, employees) for MissionTable. */
export function useMissionTableData(missionsProp, canEdit = true) {
  const missions = useSWR(Array.isArray(missionsProp) ? null : '/missions', fetchRows)
  const interventions = useSWR(canEdit ? '/interventions' : null, fetchRows)
  const employees = useSWR(canEdit ? '/users' : null, fetchRows)
  return {
    missions: missions.data || EMPTY,
    fetchMissions: () => missions.mutate(),
    interventionsList: interventions.data || EMPTY,
    employeeUsers: (employees.data || EMPTY).filter(u => u && u.isActive !== false && String(u.role).toLowerCase() === 'technicien').map(u => ({ id: Number(u.id), name: u.name })),
    fetchInterventions: () => interventions.mutate(),
    dataError: employees.error?.message || interventions.error?.message,
  }
}
