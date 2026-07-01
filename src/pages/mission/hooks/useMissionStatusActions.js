import { useState, useRef } from 'react'
import { apiFetch } from '../../../api/apiClient'

function buildGroupedEmployeesDisplay(missionLike) {
  const primary = String(missionLike?.employee || '').trim()
  const fromArray = Array.isArray(missionLike?.groupedEmployees)
    ? missionLike.groupedEmployees.map((name) => String(name || '').trim()).filter(Boolean)
    : []
  const fromDisplay = String(missionLike?.employeeDisplay || '')
    .split(',').map((n) => n.trim()).filter(Boolean)
  return Array.from(new Set([primary, ...fromArray, ...fromDisplay].filter(Boolean))).join(', ')
}

function syncMileage(setDepart, setRetour, data) {
  const raw = (field) => { const v = data?.[field]; return typeof v === 'number' || typeof v === 'string' ? v : '' }
  setDepart(raw('vehicleKilometrageDepart'))
  setRetour(raw('vehicleKilometrageRetour'))
}

/**
 * Hook encapsulating mission status change + save actions.
 */
export function useMissionStatusActions({
  mission, setMission, status, setStatus, notes,
  setGroupedEmployeesDisplay, setVehicleKilometrageDepart, setVehicleKilometrageRetour,
  vehicleKilometrageDepart, vehicleKilometrageRetour,
  setMissionActionError, refreshTimerRef, mileageEditingRef,
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveToast, setShowSaveToast] = useState(false)
  const [statusJustChangedTo, setStatusJustChangedTo] = useState('')
  const [vehicleMileageError, setVehicleMileageError] = useState('')
  const statusAnimTimerRef = useRef(null)

  const handleStatusChange = async (newStatus) => {
    if (statusAnimTimerRef.current) {
      window.clearTimeout(statusAnimTimerRef.current)
      statusAnimTimerRef.current = null
    }
    setStatus(newStatus)
    setMission((prev) => (prev ? { ...prev, status: newStatus } : prev))

    try {
      await submitMileageIfNeeded(newStatus, mission, vehicleKilometrageDepart, vehicleKilometrageRetour, setVehicleMileageError)
      await updateMissionStatus(mission.id, newStatus)

      setMissionActionError('')
      setVehicleMileageError('')
      animateStatusChange(newStatus, setStatusJustChangedTo, statusAnimTimerRef)

      await restartPolling(mission.id, setMission, setStatus, setGroupedEmployeesDisplay, setVehicleKilometrageDepart, setVehicleKilometrageRetour, mileageEditingRef, refreshTimerRef)

      setShowSaveToast(`Cette mission est ${newStatus}`)
      setTimeout(() => setShowSaveToast(false), 3000)
    } catch (error) {
      console.error('Erreur MAJ statut:', error)
      setMissionActionError(error?.message || 'Impossible de mettre à jour le statut.')
      setStatus(mission.status)
      setMission((prev) => (prev ? { ...prev, status: mission.status } : prev))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await apiFetch(`/missions/${mission.id}`, {
        method: 'PATCH',
        body: { status, notes },
        auth: true,
      })
      if (response.ok) {
        const fullRes = await apiFetch(`/missions/${mission.id}`, { auth: true, cache: 'no-store' })
        if (fullRes.ok) {
          const full = await fullRes.json().catch(() => null)
          if (full) {
            setMission((prev) => (prev ? { ...prev, ...full } : full))
            setStatus(full?.status || status)
            setGroupedEmployeesDisplay(buildGroupedEmployeesDisplay(full))
            try { window.dispatchEvent(new CustomEvent('mission:updated', { detail: full })) } catch { /* best-effort */ }
          }
        }
      }
      setShowSaveToast(true)
      setTimeout(() => setShowSaveToast(false), 3000)
    } catch { /* preserve current view */ }
    setIsSaving(false)
  }

  return {
    isSaving, showSaveToast, statusJustChangedTo, vehicleMileageError,
    handleStatusChange, handleSave,
  }
}

// ─── Pure sub-functions ───────────────────────────────────────────────────────

async function submitMileageIfNeeded(newStatus, mission, depart, retour, setError) {
  if (newStatus !== 'Terminée' || !mission.vehicleId) return
  const departText = String(depart ?? '').trim()
  const retourText = String(retour ?? '').trim()
  if (departText === '' && retourText === '') return

  const kmRes = await apiFetch(`/missions/${mission.id}/vehicle-kilometrage`, {
    method: 'PATCH',
    body: {
      vehicleKilometrageDepart: departText === '' ? null : Number(departText),
      vehicleKilometrageRetour: retourText === '' ? null : Number(retourText),
    },
    auth: true,
  })
  if (!kmRes.ok) {
    const kmErr = await kmRes.json().catch(() => ({}))
    setError(kmErr.message || 'Kilométrage non enregistré, statut mis à jour.')
  }
}

async function updateMissionStatus(missionId, newStatus) {
  const response = await apiFetch(`/missions/${missionId}`, {
    method: 'PATCH',
    body: { status: newStatus },
    auth: true,
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Impossible de mettre à jour le statut.')
  }
}

function animateStatusChange(newStatus, setStatusJustChangedTo, timerRef) {
  setStatusJustChangedTo(newStatus)
  timerRef.current = window.setTimeout(() => {
    setStatusJustChangedTo('')
    timerRef.current = null
  }, 700)
}

async function restartPolling(missionId, setMission, setStatus, setGroupedEmployees, setDepart, setRetour, mileageEditingRef, refreshTimerRef) {
  if (refreshTimerRef.current) {
    window.clearInterval(refreshTimerRef.current)
    refreshTimerRef.current = null
  }

  const missionRes = await apiFetch(`/missions/${missionId}`, { auth: true, cache: 'no-store' })
  if (missionRes.ok) {
    const latest = await missionRes.json().catch(() => null)
    if (latest) {
      setMission((prev) => (prev ? { ...prev, ...latest, status: latest.status || prev.status } : latest))
      setStatus(latest.status || 'À faire')
      setGroupedEmployees(buildGroupedEmployeesDisplay(latest))
      syncMileage(setDepart, setRetour, latest)
      try { window.dispatchEvent(new CustomEvent('mission:updated', { detail: latest })) } catch { /* best-effort */ }
    }
  }

  refreshTimerRef.current = window.setInterval(async () => {
    try {
      const pollRes = await apiFetch(`/missions/${missionId}`, { auth: true, cache: 'no-store' })
      if (!pollRes.ok) return
      const pollData = await pollRes.json()
      const nextStatus = pollData?.status || 'À faire'
      setMission((prev) => (prev ? { ...prev, ...pollData, status: nextStatus } : pollData))
      setStatus((prev) => (prev !== nextStatus ? nextStatus : prev))
      setGroupedEmployees(buildGroupedEmployeesDisplay(pollData))
      if (!mileageEditingRef.current) syncMileage(setDepart, setRetour, pollData)
    } catch { /* best-effort */ }
  }, 5000)
}
