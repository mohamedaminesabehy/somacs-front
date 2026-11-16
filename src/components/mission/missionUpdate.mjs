function buildMissionSite(missionType, formSite, selectedIntervention) {
  return missionType === 'Normal' ? formSite : selectedIntervention?.client
}

export function buildMissionUpdateRequest(params) {
  const {
    formMissionId, formTitle, formDescription, formPriority, formStatus, formDueDate, formDueTime, formNotes,
    missionType, formSite, formAddress, selectedIntervention, selectedInterventionId,
    formEmployeeIds, formVehicleId, formDriverId, expectedStatus, existingAttachments,
  } = params
  if (!formMissionId) throw new Error('Mission introuvable : la modification ne peut pas être enregistrée.')
  const teamIds = (formEmployeeIds || []).map(Number).filter(Boolean)
  if (teamIds.length === 0) throw new Error('Veuillez sélectionner au moins un technicien.')
  return {
    path: `/missions/${formMissionId}`,
    method: 'PATCH',
    body: {
      title: formTitle.trim(),
      description: formDescription.trim(),
      employeeUserIds: teamIds,
      vehicleId: formVehicleId ? Number(formVehicleId) : null,
      driverUserId: formVehicleId && formDriverId ? Number(formDriverId) : null,
      ...(expectedStatus ? { expectedStatus } : {}),
      priority: formPriority,
      status: formStatus,
      ...(formDueDate ? { dueDate: formDueDate } : {}),
      dueTime: formDueTime || null,
      notes: formNotes,
      type: missionType,
      site: formSite || buildMissionSite(missionType, formSite, selectedIntervention),
      address: formAddress,
      interventionId: missionType === 'Intervention' ? selectedInterventionId : null,
      attachments: existingAttachments || [],
    },
  }
}

async function uploadMissionAttachments(fetcher, missionId, newAttachments) {
  if (!missionId || newAttachments.length === 0) return
  const form = new FormData()
  for (const file of newAttachments) form.append('files', file)
  const uploadRes = await fetcher(`/missions/${missionId}/attachments`, { method: 'POST', body: form, auth: true })
  if (!uploadRes.ok) throw new Error('Mission enregistrée, mais les pièces jointes n’ont pas pu être envoyées. Vérifiez les fichiers avant de réessayer.')
}

export async function updateMissionWith(fetcher, { newAttachments = [], ...params }) {
  const request = buildMissionUpdateRequest(params)
  const response = await fetcher(request.path, { method: request.method, body: request.body, auth: true })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message
    throw new Error(`${response.status === 409 ? 'Conflit (409) : ' : ''}${message || 'Impossible d’enregistrer la mission.'}`)
  }
  const saved = await response.json().catch(() => null)
  await uploadMissionAttachments(fetcher, params.formMissionId, newAttachments)
  return saved
}

// The drawer must stay open (with the user's edits) until the save is confirmed.
export async function submitMissionEdit({ save, closeDrawer, refresh }) {
  const saved = await save()
  closeDrawer()
  await refresh()
  return saved
}
