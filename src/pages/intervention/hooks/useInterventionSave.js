import { useState } from 'react'
import { apiFetch } from '../../../api/apiClient'

const HTTP_MESSAGES = {
  401: 'Votre session a expiré. Reconnectez-vous.',
  403: 'Vous n’avez pas les droits pour modifier ce dossier.',
  404: 'Ce dossier d’intervention est introuvable.',
  409: 'Le dossier a été modifié entre-temps. Rechargez la page.',
}

/**
 * Encapsulates the intervention save logic including finalize and navigation.
 */
export function useInterventionSave({
  id,
  interventionData,
  parts,
  laborPrice,
  status,
  completedUpTo,
  sections,
  missionId,
  setDbEntry,
  setStatus,
  setIsEditing,
  navigate,
  onError,
}) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (options = {}) => {
    setIsSaving(true)
    try {
      const isFinalSave = Boolean(options.finalize)
      const effectiveStatus = isFinalSave ? 'CLOSED' : status
      const effectiveCompletedUpTo = isFinalSave ? sections.length : completedUpTo
      const payload = buildSavePayload({
        id, interventionData, parts, laborPrice,
        effectiveStatus, effectiveCompletedUpTo,
      })

      const response = await apiFetch(`/interventions/${id}`, {
        method: 'PATCH',
        body: payload,
      })
      const title = isFinalSave ? 'Clôture refusée' : 'Enregistrement impossible'
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const detail = Array.isArray(body?.message) ? body.message.join(' ') : body?.message
        const fallback = HTTP_MESSAGES[response.status] || `Le serveur a répondu avec une erreur (${response.status}).`
        onError?.(detail || fallback, title)
        return false
      }
      const saved = await response.json().catch(() => null)
      if (saved) setDbEntry(saved)

      handlePostSaveNavigation({
        isFinalSave, options, id, missionId, saved, navigate, setStatus, setIsEditing,
      })
      return true
    } catch {
      onError?.('Impossible de joindre le serveur. Vérifiez la connexion puis réessayez.', 'Serveur injoignable')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return { isSaving, handleSave }
}

function buildSavePayload({ id, interventionData, parts, laborPrice, effectiveStatus, effectiveCompletedUpTo }) {
  return {
    id,
    status: effectiveStatus,
    completedUpToSection: effectiveCompletedUpTo,
    technicianName: interventionData.technicianName,
    interventionDate: interventionData.interventionDate,
    ficheNumber: interventionData.ficheNumber,
    startTime: interventionData.startTime,
    endTime: interventionData.endTime,
    totalTime: interventionData.totalTime,
    siteName: interventionData.siteName,
    requestorName: interventionData.requestorName,
    clientId: interventionData.clientId || null,
    machineId: interventionData.machineId || null,
    problemDescription: interventionData.problemDescription,
    telephoneDiagnostic: interventionData.telephoneDiagnostic,
    interventionType: interventionData.interventionType,
    interventionDetail: interventionData.interventionDetail,
    numEssai: interventionData.numEssai,
    essaiConcluant: interventionData.essaiConcluant,
    parts,
    laborPrice: Number(laborPrice) || 0,
  }
}

function handlePostSaveNavigation({ isFinalSave, options, id, missionId, saved, navigate, setStatus, setIsEditing }) {
  if (isFinalSave) {
    setStatus('CLOSED')
    setIsEditing(false)
  } else if (options.exitEdit) {
    setIsEditing(false)
  }

  if (options.returnTo) {
    markInterventionModified(id)
    navigate(options.returnTo)
    return
  }

  if (isFinalSave) {
    const linkedMissionId = missionId || saved?.missionId || saved?.mission?.id
    if (linkedMissionId) {
      navigate(`/missions/${linkedMissionId}`, {
        state: { interventionClosedSuccess: true, interventionId: id },
      })
    }
  }
}

function markInterventionModified(id) {
  try {
    const raw = window.localStorage.getItem('intervention_modified_ids')
    const list = raw ? JSON.parse(raw) : []
    const next = Array.isArray(list) ? list : []
    if (!next.includes(id)) {
      next.push(id)
      window.localStorage.setItem('intervention_modified_ids', JSON.stringify(next))
    }
  } catch {
    // Modified intervention marker is optional local UI state.
  }
}
