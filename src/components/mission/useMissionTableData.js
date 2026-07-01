import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../../api/apiClient'

/**
 * Handles data-fetching (missions, interventions, employees) for MissionTable.
 */
export function useMissionTableData(missionsProp) {
  const [missions, setMissions] = useState([])
  const [interventionsList, setInterventionsList] = useState([])
  const [employeeUsers, setEmployeeUsers] = useState([])

  const fetchMissions = useCallback(async () => {
    try {
      const response = await apiFetch('/missions', { auth: true })
      if (response.ok) setMissions(await response.json())
    } catch (error) {
      console.error('Error fetching missions:', error)
    }
  }, [])

  const fetchInterventions = useCallback(async () => {
    try {
      const response = await apiFetch('/interventions', { auth: true })
      if (response.ok) setInterventionsList(await response.json())
    } catch (error) {
      console.error('Error fetching interventions:', error)
    }
  }, [])

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await apiFetch('/users', { auth: true })
      if (!response.ok) return
      const data = await response.json().catch(() => [])
      const users = Array.isArray(data) ? data : []
      setEmployeeUsers(users.filter((u) => u && u.isActive !== false).map((u) => ({ id: u.id, name: u.name })))
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!Array.isArray(missionsProp)) fetchMissions()
      fetchInterventions()
      fetchEmployees()
    }, 0)
    return () => window.clearTimeout(t)
  }, [fetchMissions, fetchInterventions, fetchEmployees, missionsProp])

  return {
    missions, setMissions, fetchMissions,
    interventionsList, employeeUsers, fetchInterventions,
  }
}
