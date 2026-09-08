import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../../api/apiClient'
import { formatClientAddress, getInterventionStatusLabel as getStatusLabel } from '../../../utils/intervention'

// ─── Normalizers (extracted to reduce cognitive complexity) ────────────────────

function normalizeVehicle(vehicle) {
  return {
    id: vehicle.id ?? vehicle.vehicleId ?? vehicle.vehicle_id,
    matricule: vehicle.matricule || vehicle.immatriculation || '',
    marque: vehicle.marque || vehicle.brand || '',
    modele: vehicle.modele || vehicle.model || '',
    statut: vehicle.statut || vehicle.status || '',
    disponibilite: vehicle.disponibilite ?? vehicle.disponibility,
    activeMission: vehicle.activeMission || null,
  }
}

function normalizeIntervention(i) {
  return {
    id: i.id,
    client: i.client || i.clientName || '',
    machine: i.machine || i.machineType || i.machineEntity?.designation || '',
    type: i.type || i.interventionType || '',
    status: i.status || 'PENDING',
    statusLabel: getStatusLabel(i.status),
    date: i.date || i.interventionDate || '',
    phone: i.phone || i.clientPhone || i.clientEntity?.phone || '',
    clientCode: i.clientCode || i.clientEntity?.code || '',
    site: i.siteName || i.site || i.machineEntity?.site || '',
    address: i.clientAddress || i.address || formatClientAddress(i.clientEntity) || '',
    request: i.request || i.problemDescription || '',
    assignedTo: i.assignedTo || i.assignee || i.technicianName || null,
  }
}

function normalizeEmployee(u) {
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    avatar: getAvatarFromName(u.name),
    active: 0,
  }
}

function getAvatarFromName(name) {
  if (!name) return ''
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Custom hook that encapsulates data-fetching for the AssignMission page.
 */
export function useAssignMissionData() {
  const [interventionsList, setInterventionsList] = useState([])
  const [employeeList, setEmployeeList] = useState([])
  const [availableVehicles, setAvailableVehicles] = useState([])
  const [availableVehiclesLoading, setAvailableVehiclesLoading] = useState(true)

  const loadAvailableVehicles = useCallback(async () => {
    try {
      setAvailableVehiclesLoading(true)
      const response = await apiFetch('/vehicles/available', { auth: true, cache: 'no-store' })
      if (!response.ok) return
      const data = await response.json()
      const items = Array.isArray(data) ? data : []
      setAvailableVehicles(items.map(normalizeVehicle).filter((v) => Boolean(v.id)))
    } catch {
      setAvailableVehicles([])
    } finally {
      setAvailableVehiclesLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAvailableVehicles()
  }, [loadAvailableVehicles])

  useEffect(() => {
    const handleFocus = () => {
      void loadAvailableVehicles()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadAvailableVehicles])

  useEffect(() => {
    void (async () => {
      try {
        const response = await apiFetch('/interventions', { auth: true })
        if (!response.ok) return
        const data = await response.json()
        const items = Array.isArray(data) ? data : []
        setInterventionsList(items.map(normalizeIntervention))
      } catch {
        // Intervention options are optional
      }
    })()
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const response = await apiFetch('/users')
        if (!response.ok) return
        const data = await response.json()
        const users = Array.isArray(data) ? data : []
        setEmployeeList(users.filter((u) => u && u.isActive !== false).map(normalizeEmployee))
      } catch {
        // Employee options are optional
      }
    })()
  }, [])

  return { interventionsList, employeeList, availableVehicles, availableVehiclesLoading, refreshAvailableVehicles: loadAvailableVehicles }
}
