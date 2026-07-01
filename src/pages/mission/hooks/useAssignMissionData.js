import { useEffect, useState } from 'react'
import { apiFetch } from '../../../api/apiClient'
import { formatClientAddress, getInterventionStatusLabel as getStatusLabel } from '../../../utils/intervention'

/**
 * Custom hook that encapsulates data-fetching for the AssignMission page.
 * Fetches interventions, employees, and available vehicles.
 */
export function useAssignMissionData() {
  const [interventionsList, setInterventionsList] = useState([])
  const [employeeList, setEmployeeList] = useState([])
  const [availableVehicles, setAvailableVehicles] = useState([])
  const [availableVehiclesLoading, setAvailableVehiclesLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        setAvailableVehiclesLoading(true)
        const response = await apiFetch('/vehicles/available', { auth: true })
        if (!response.ok) return
        const data = await response.json()
        const normalized = Array.isArray(data)
          ? data
              .map((vehicle) => ({
                id: vehicle.id ?? vehicle.vehicleId ?? vehicle.vehicle_id,
                matricule: vehicle.matricule || vehicle.immatriculation || '',
                marque: vehicle.marque || vehicle.brand || '',
                modele: vehicle.modele || vehicle.model || '',
                statut: vehicle.statut || vehicle.status || '',
                disponibilite: vehicle.disponibilite ?? vehicle.disponibility,
                activeMission: vehicle.activeMission || null,
              }))
              .filter((vehicle) => Boolean(vehicle.id))
          : []
        setAvailableVehicles(normalized)
      } catch {
        setAvailableVehicles([])
      } finally {
        setAvailableVehiclesLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const response = await apiFetch('/interventions', { auth: true })
        if (!response.ok) return
        const data = await response.json()
        const normalized = Array.isArray(data)
          ? data.map((i) => ({
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
            }))
          : []
        setInterventionsList(normalized)
      } catch {
        // Intervention options are optional; keep the selector empty on failure.
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
        const normalized = users
          .filter((u) => u && u.isActive !== false)
          .map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role,
            avatar: getAvatarFromName(u.name),
            active: 0,
          }))
        setEmployeeList(normalized)
      } catch {
        // Employee options are optional; keep the selector empty on failure.
      }
    })()
  }, [])

  return {
    interventionsList,
    employeeList,
    availableVehicles,
    availableVehiclesLoading,
  }
}

function getAvatarFromName(name) {
  if (!name) return ''
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}
