import { useState, useEffect } from 'react'
import { apiFetch } from '../../../api/apiClient'
import {
  buildAssignedEmployeesDisplay,
} from '../../../utils/intervention'
import { interventionsDB } from '../interventionsMockData'

// ─── Helper: resolve employees from a single mission ──────────────────────────
async function resolveEmployeesFromMission(missionId, fallback) {
  const response = await apiFetch(`/missions/${missionId}`, { cache: 'no-store' })
  if (!response.ok) return fallback
  const missionData = await response.json()
  return buildAssignedEmployeesDisplay(missionData, fallback)
}

// ─── Helper: resolve employees from all linked missions ───────────────────────
async function resolveEmployeesFromLinkedMissions(interventionId, fallback) {
  const listResponse = await apiFetch('/missions', { cache: 'no-store' })
  if (!listResponse.ok) return fallback

  const missions = await listResponse.json().catch(() => [])
  const rows = Array.isArray(missions) ? missions : []
  const linkedRows = rows.filter((m) => String(m?.interventionId || '') === String(interventionId))

  if (linkedRows.length === 0) return fallback

  const names = new Set()
  for (const row of linkedRows) {
    const display = buildAssignedEmployeesDisplay(row, fallback)
    display.split(',').map((n) => n.trim()).filter(Boolean).forEach((n) => names.add(n))
  }
  return names.size > 0 ? Array.from(names).join(', ') : fallback
}

/**
 * Custom hook that encapsulates all data-fetching logic for InterventionDetails.
 */
export function useInterventionData({ id, missionId, assignedTechnicianName }) {
  const [dbEntry, setDbEntry] = useState(() => interventionsDB[id] || interventionsDB['INT-2026-001'])
  const [clients, setClients] = useState([])
  const [machines, setMachines] = useState([])
  const [signatures, setSignatures] = useState([])
  const [assignedMissionEmployees, setAssignedMissionEmployees] = useState(() => assignedTechnicianName)

  // Fetch intervention data
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await apiFetch(`/interventions/${id}`)
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled && data) setDbEntry(data)
      } catch { /* Intervention reload is optional */ }
    })()
    return () => { cancelled = true }
  }, [id])

  // Fetch signatures
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await apiFetch(`/interventions/${id}/signatures`, { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json().catch(() => [])
        if (!cancelled) setSignatures(Array.isArray(data) ? data : [])
      } catch { /* Signature list is optional */ }
    })()
    return () => { cancelled = true }
  }, [id])

  // Fetch clients and machines for selection
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [clientsRes, machinesRes] = await Promise.all([
          apiFetch('/clients'),
          apiFetch('/machines'),
        ])
        const clientsJson = clientsRes.ok ? await clientsRes.json() : []
        const machinesJson = machinesRes.ok ? await machinesRes.json() : []
        if (!cancelled) {
          setClients(Array.isArray(clientsJson) ? clientsJson : [])
          setMachines(Array.isArray(machinesJson) ? machinesJson : [])
        }
      } catch { /* Client and machine lookup data is optional for this view */ }
    })()
    return () => { cancelled = true }
  }, [])

  // Fetch assigned employees from mission
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = missionId
          ? await resolveEmployeesFromMission(missionId, assignedTechnicianName)
          : await resolveEmployeesFromLinkedMissions(id, assignedTechnicianName)
        if (!cancelled) setAssignedMissionEmployees(result)
      } catch {
        if (!cancelled) setAssignedMissionEmployees(assignedTechnicianName)
      }
    })()
    return () => { cancelled = true }
  }, [missionId, assignedTechnicianName, id])

  return {
    dbEntry,
    setDbEntry,
    clients,
    machines,
    signatures,
    setSignatures,
    assignedMissionEmployees,
  }
}
