import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../../../api/apiClient'

/**
 * Handles mission list data fetching, toast messages, and highlight state.
 */
export function useListMissionData({ location, navigate }) {
  const [missions, setMissions] = useState([])
  const [toast, setToast] = useState({ open: false, message: '' })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mission: null, isDeleting: false })
  const [highlightMissionId, setHighlightMissionId] = useState('')
  const [highlightGroupId, setHighlightGroupId] = useState('')
  const toastTimerRef = useRef(null)
  const highlightTimerRef = useRef(null)

  const showToast = (message, durationMs = 3000) => {
    if (toastTimerRef.current) { window.clearTimeout(toastTimerRef.current); toastTimerRef.current = null }
    setToast({ open: true, message })
    toastTimerRef.current = window.setTimeout(() => {
      setToast({ open: false, message: '' })
      toastTimerRef.current = null
    }, durationMs)
  }

  const dismissToast = () => {
    if (toastTimerRef.current) { window.clearTimeout(toastTimerRef.current); toastTimerRef.current = null }
    setToast({ open: false, message: '' })
  }

  const refreshMissions = async () => {
    try {
      const response = await apiFetch('/missions', { auth: true })
      if (!response.ok) return
      const data = await response.json()
      setMissions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching missions:', error)
    }
  }

  // Initial fetch
  useEffect(() => {
    const t = window.setTimeout(() => refreshMissions(), 0)
    return () => window.clearTimeout(t)
  }, [])

  // Handle navigation state (toast + highlight)
  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const toastKey = params.get('toast') || location.state?.toast || ''
    const highlight = params.get('highlight') || location.state?.highlight || ''
    const highlightGroup = params.get('highlightGroup') || location.state?.highlightGroup || ''
    if (!toastKey && !highlight && !highlightGroup) return

    if (toastTimerRef.current) { window.clearTimeout(toastTimerRef.current); toastTimerRef.current = null }
    if (highlightTimerRef.current) { window.clearTimeout(highlightTimerRef.current); highlightTimerRef.current = null }

    if (toastKey === 'assigned') {
      window.setTimeout(() => showToast('Nouvelle mission affectée avec succès.', 3000), 0)
    }

    if (highlight || highlightGroup) {
      window.setTimeout(() => {
        setHighlightMissionId(String(highlight || ''))
        setHighlightGroupId(String(highlightGroup || ''))
        highlightTimerRef.current = window.setTimeout(() => {
          setHighlightMissionId('')
          setHighlightGroupId('')
          highlightTimerRef.current = null
        }, 1800)
      }, 0)
    }

    if (location.search || location.state?.toast || location.state?.highlight || location.state?.highlightGroup) {
      navigate({ pathname: location.pathname, search: '' }, { replace: true, state: {} })
    }

    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = null
    }
  }, [location.pathname, location.search, location.state, navigate])

  // Handle background toast from sessionStorage
  useEffect(() => {
    const msg = typeof window !== 'undefined' ? window.sessionStorage.getItem('missions_bg_toast') : ''
    if (!msg) return
    window.sessionStorage.removeItem('missions_bg_toast')
    window.setTimeout(() => showToast(msg, 4000), 0)
  }, [])

  // Delete handler
  const handleDeleteMission = async () => {
    const missionToDelete = deleteDialog.mission
    if (!missionToDelete?.id || deleteDialog.isDeleting) return
    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }))

    try {
      const groupId = String(missionToDelete?.assignmentGroupId || '').trim()
      let success = false

      if (groupId) {
        const groupedIds = missions
          .filter((m) => String(m?.assignmentGroupId || '').trim() === groupId)
          .map((m) => m.id)
        const results = await Promise.all(
          groupedIds.map((rowId) => apiFetch(`/missions/${rowId}`, { method: 'DELETE', auth: true })),
        )
        success = results.every((res) => res.ok)
      } else {
        const response = await apiFetch(`/missions/${missionToDelete.id}`, { method: 'DELETE', auth: true })
        success = response.ok
      }

      if (success) {
        await refreshMissions()
        setDeleteDialog({ open: false, mission: null, isDeleting: false })
        showToast(groupId ? 'Mission de groupe supprimée avec succès.' : 'Mission supprimée avec succès.', 3500)
      } else {
        setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
        showToast('Échec de la suppression de la mission.', 4000)
      }
    } catch {
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
      showToast('Erreur lors de la suppression de la mission.', 4000)
    }
  }

  return {
    missions, refreshMissions,
    toast, showToast, dismissToast,
    deleteDialog, setDeleteDialog, handleDeleteMission,
    highlightMissionId, highlightGroupId,
  }
}
