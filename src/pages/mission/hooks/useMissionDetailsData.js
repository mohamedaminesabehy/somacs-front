import { useState, useEffect, useMemo, useRef } from 'react'
import { apiFetch } from '../../../api/apiClient'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildGroupedEmployeesDisplay(missionLike) {
  const primary = String(missionLike?.employee || '').trim()
  const fromArray = Array.isArray(missionLike?.groupedEmployees)
    ? missionLike.groupedEmployees.map((name) => String(name || '').trim()).filter(Boolean)
    : []
  const fromDisplay = String(missionLike?.employeeDisplay || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
  return Array.from(new Set([primary, ...fromArray, ...fromDisplay].filter(Boolean))).join(', ')
}

function syncVehicleMileageState(setDepart, setRetour, missionLike) {
  const raw = (field) => {
    const v = missionLike?.[field]
    return typeof v === 'number' || typeof v === 'string' ? v : ''
  }
  setDepart(raw('vehicleKilometrageDepart'))
  setRetour(raw('vehicleKilometrageRetour'))
}

function normalizeAttachment(a, idx) {
  const isPdf = a.format === 'pdf' || (a.url && a.url.toLowerCase().includes('.pdf'))
  const isImage = a.resourceType === 'image' && !isPdf
  let displayUrl = a.url
  let viewUrl = a.url
  let downloadUrl = a.url
  if (isPdf && a.url) {
    displayUrl = a.url.replace('/upload/', '/upload/pg_1,f_png/')
    downloadUrl = a.url.replace('/upload/', '/upload/fl_attachment/')
  }
  return {
    id: a.publicId || String(idx),
    name: a.originalFilename || a.publicId || `Fichier ${idx + 1}`,
    type: isImage ? 'image' : 'file',
    size: typeof a.bytes === 'number' ? `${Math.ceil(a.bytes / 1024)} KB` : '',
    date: a.createdAt || '',
    url: a.url,
    displayUrl, viewUrl, downloadUrl,
    publicId: a.publicId || '',
    isPdf,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMissionDetailsData(id) {
  const [mission, setMission] = useState(null)
  const [intervention, setIntervention] = useState(null)
  const [isLoadingMission, setIsLoadingMission] = useState(true)
  const [status, setStatus] = useState('À faire')
  const [notes, setNotes] = useState('')
  const [groupedEmployeesDisplay, setGroupedEmployeesDisplay] = useState('')
  const [vehicleKilometrageDepart, setVehicleKilometrageDepart] = useState('')
  const [vehicleKilometrageRetour, setVehicleKilometrageRetour] = useState('')
  const [missionActionError, setMissionActionError] = useState('')
  const refreshTimerRef = useRef(null)
  const mileageEditingRef = useRef(false)

  const attachments = useMemo(() => {
    const list = Array.isArray(mission?.attachments) ? mission.attachments : []
    return list.map(normalizeAttachment)
  }, [mission])

  // Initial fetch
  useEffect(() => {
    void (async () => {
      setIsLoadingMission(true)
      try {
        const response = await apiFetch(`/missions/${id}`, { auth: true, cache: 'no-store' })
        if (!response.ok) {
          if (response.status === 403) setMissionActionError("Accès refusé : vous n'avez pas la permission (403).")
          setMission(null)
          return
        }
        const data = await response.json()
        setMission(data)
        setStatus(data?.status || 'À faire')
        setNotes(data?.notes || '')
        setGroupedEmployeesDisplay(buildGroupedEmployeesDisplay(data))
        syncVehicleMileageState(setVehicleKilometrageDepart, setVehicleKilometrageRetour, data)
      } catch {
        setMission(null)
      } finally {
        setIsLoadingMission(false)
      }
    })()
  }, [id])

  // Fetch linked intervention
  useEffect(() => {
    if (!mission?.interventionId) { setIntervention(null); return }
    void (async () => {
      try {
        const response = await apiFetch(`/interventions/${mission.interventionId}`, { auth: true })
        if (response.ok) setIntervention(await response.json())
      } catch { /* optional */ }
    })()
  }, [mission?.interventionId])

  // Background polling
  useEffect(() => {
    const missionId = mission?.id
    const interventionId = mission?.interventionId
    if (!missionId) return
    const refresh = () => refreshMission({
      missionRef: { id: missionId, interventionId },
      setMission, setStatus, setGroupedEmployeesDisplay,
      setDepart: setVehicleKilometrageDepart, setRetour: setVehicleKilometrageRetour,
      setIntervention, mileageEditingRef,
    })
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    refreshTimerRef.current = window.setInterval(refresh, 5000)
    return () => {
      window.removeEventListener('focus', onFocus)
      if (refreshTimerRef.current) window.clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [mission?.id, mission?.interventionId])

  return {
    mission, setMission, intervention, isLoadingMission,
    status, setStatus, notes, setNotes,
    groupedEmployeesDisplay, setGroupedEmployeesDisplay,
    vehicleKilometrageDepart, setVehicleKilometrageDepart,
    vehicleKilometrageRetour, setVehicleKilometrageRetour,
    missionActionError, setMissionActionError,
    attachments, mileageEditingRef, refreshTimerRef,
  }
}

// ─── Background refresh helper ────────────────────────────────────────────────

async function refreshMission({ missionRef, setMission, setStatus, setGroupedEmployeesDisplay, setDepart, setRetour, setIntervention, mileageEditingRef }) {
  try {
    const missionRes = await apiFetch(`/missions/${missionRef.id}`, { auth: true, cache: 'no-store' })
    if (missionRes.ok) {
      const data = await missionRes.json()
      const nextStatus = data?.status || 'À faire'
      setMission((prev) => (prev ? { ...prev, ...data, status: nextStatus } : data))
      setStatus((prev) => (prev !== nextStatus ? nextStatus : prev))
      setGroupedEmployeesDisplay(buildGroupedEmployeesDisplay(data))
      if (!mileageEditingRef.current) {
        syncVehicleMileageState(setDepart, setRetour, data)
      }
    }
    if (missionRef.interventionId) {
      const ivRes = await apiFetch(`/interventions/${missionRef.interventionId}`, { auth: true, cache: 'no-store' })
      if (ivRes.ok) setIntervention(await ivRes.json())
    }
  } catch { /* best-effort */ }
}
