import { useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch } from '../../../api/apiClient'




const STEPS_COUNT = 4

export function useAssignMissionForm({ interventionsList, employeeList, navigate, prefillInterventionId }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [missionType, setMissionType] = useState('')
  const [formData, setFormData] = useState({ title: '', description: '', site: '', address: '', interventionId: '' })
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [showMaxEmployeesPopup, setShowMaxEmployeesPopup] = useState(false)
  const [priority, setPriority] = useState('Moyenne')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [driverChoice, setDriverUserId] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const siteManuallyEditedRef = useRef(false)

  const fileInputRef = useRef(null)
  const isMountedRef = useRef(true)

  // Cleanup
  useEffect(() => () => { isMountedRef.current = false }, [])

  // Auto-dismiss max employees popup
  useEffect(() => {
    if (!showMaxEmployeesPopup) return
    const timer = setTimeout(() => setShowMaxEmployeesPopup(false), 2200)
    return () => clearTimeout(timer)
  }, [showMaxEmployeesPopup])

  // Prefill from navigation state, applied once on mount via a useEffect.
  // Using setState synchronously inside the render body is a React anti-pattern
  // (triggers a double-render on strict mode and can cause infinite loops).
  const [prefillApplied, setPrefillApplied] = useState(false)
  useEffect(() => {
    if (prefillApplied || !prefillInterventionId) return
    setPrefillApplied(true)
    setMissionType('Intervention')
    setCurrentStep(2)
    setFormData((prev) => ({
      ...prev,
      interventionId: prefillInterventionId,
      title: prev.title || `Intervention SAV — ${prefillInterventionId}`,
      description: '',
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillInterventionId])

  // Reset site manual edit flag on type change
  useEffect(() => {
    if (missionType === 'Intervention') siteManuallyEditedRef.current = false
  }, [missionType])

  // Computed
  const linkableInterventions = useMemo(
    () => interventionsList.filter((i) => i.status === 'PENDING' && !String(i.assignedTo || '').trim()),
    [interventionsList],
  )

  const selectedIntervention = linkableInterventions.find((i) => i.id === formData.interventionId)
  const selectedEmployeeObjs = employeeList.filter((e) => selectedEmployees.includes(e.name))
  const driverUserId = resolveDriver(selectedEmployeeObjs, vehicleId, driverChoice)

  // Sync site from selected intervention
  useEffect(() => {
    if (missionType !== 'Intervention' || !selectedIntervention) return
    setFormData((prev) => ({
      ...prev,
      site: siteManuallyEditedRef.current
        ? prev.site
        : (String(selectedIntervention.site || '').trim() || prev.site),
      address: String(prev.address || '').trim() ? prev.address : (selectedIntervention.address || ''),
    }))
  }, [missionType, selectedIntervention])

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'site') siteManuallyEditedRef.current = true
    if (name === 'interventionId') siteManuallyEditedRef.current = false
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const canGoNext = () => {
    if (currentStep === 1) return missionType !== ''
    if (currentStep === 2) {
      if (missionType === 'Normal') return formData.title.trim() !== '' && formData.description.trim() !== ''
      if (missionType === 'Intervention') return formData.interventionId !== '' && formData.title.trim() !== ''
    }
    if (currentStep === 3) return selectedEmployees.length > 0 && dueDate !== ''
    return true
  }

  const toggleEmployeeSelection = (employeeName) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeName)) return prev.filter((n) => n !== employeeName)
      if (prev.length >= 3) { setShowMaxEmployeesPopup(true); return prev }
      return [...prev, employeeName]
    })
  }

  const nextStep = () => { if (canGoNext()) setCurrentStep((prev) => Math.min(prev + 1, STEPS_COUNT)) }
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))
  /** Navigate directly to any step without looping through intermediate steps.
   *  Replaces the previous loop-based goToStep in AssignMission.jsx which
   *  relied on N batched setState calls that React 18 collapses into one. */
  const goToStep = (target) => setCurrentStep(Math.max(1, Math.min(target, STEPS_COUNT)))

  const handlePickFiles = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const maxBytes = 10 * 1024 * 1024
    const allowed = files.filter((f) => f.size <= maxBytes)
    if (allowed.length !== files.length) alert('Certains fichiers dépassent 10MB et ont été ignorés.')
    setAttachments((prev) => {
      const next = [...prev, ...allowed].slice(0, 10)
      const uniq = new Map()
      for (const f of next) {
        const key = `${f.name}_${f.size}_${f.lastModified}`
        if (!uniq.has(key)) uniq.set(key, f)
      }
      return Array.from(uniq.values())
    })
    e.target.value = ''
  }

  const removeAttachment = (file) => {
    setAttachments((prev) => prev.filter((f) => !(f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)))
  }

  const openFilePicker = () => { const el = fileInputRef.current; if (el) { el.value = ''; el.click() } }

  const handleSubmit = async () => {
    if (isSubmitting) return
    const selectedNames = selectedEmployees
    try {
      setIsSubmitting(true)
      const validationError = validateSubmission({ selectedEmployeeObjs, missionType, formData, vehicleId, driverUserId })
      if (validationError) {
        alert(validationError)
        if (isMountedRef.current) setIsSubmitting(false)
        return
      }

      const cleanedTitle = String(formData.title || '').trim()
      const cleanedDescription = String(formData.description || '').trim()
      const createdMissions = []
      const payloadDescription = cleanedDescription ||
        buildFallbackDescription(missionType, selectedIntervention, formData.interventionId)
      const selectedVehicleId = vehicleId ? Number(vehicleId) : null
      const [leader] = selectedEmployeeObjs

      // Une seule mission partagée : l'équipe, le véhicule et le chauffeur
      // sont validés et enregistrés côté Backend dans une même transaction.
      const payload = {
        title: cleanedTitle,
        description: payloadDescription,
        employee: leader.name,
        employeeUserId: leader.id,
        employeeUserIds: selectedEmployeeObjs.map((employee) => employee.id),
        priority,
        status: 'À faire',
        dueDate: dueDate || "Aujourd'hui",
        dueTime: dueTime || null,
        type: missionType,
        interventionId: missionType === 'Intervention' ? formData.interventionId : null,
        site: formData.site,
        address: formData.address,
        ...(selectedVehicleId ? { vehicleId: selectedVehicleId } : {}),
        ...(selectedVehicleId && driverUserId ? { driverUserId: Number(driverUserId) } : {}),
      }

      const response = await apiFetch('/missions', { method: 'POST', body: payload, auth: true })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = Array.isArray(errorData?.message) ? errorData.message.join(', ') : (errorData?.message || 'Erreur lors de la création de la mission.')
        console.error('[AssignMission] POST /missions failed:', response.status, errorData)
        alert(message)
        if (isMountedRef.current) setIsSubmitting(false)
        return
      }
      const createdMission = await response.json().catch(() => null)
      if (createdMission?.id) createdMissions.push(createdMission)

      navigateAfterSubmit(navigate, createdMissions, null)
      finalizeAfterSubmit({ createdMissions, missionType, formData, selectedNames, attachments })
    } catch (error) {
      console.error('[AssignMission] erreur inattendue:', error)
      const isNetworkError = error instanceof TypeError && error.message.toLowerCase().includes('fetch')
      const msg = isNetworkError
        ? 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.'
        : `Erreur: ${error?.message || 'Une erreur inattendue est survenue.'}`
      alert(msg)
      if (isMountedRef.current) setIsSubmitting(false)
    }
  }

  return {
    currentStep, missionType, setMissionType, formData, handleChange,
    selectedEmployees, toggleEmployeeSelection, showMaxEmployeesPopup,
    priority, setPriority, dueDate, setDueDate, dueTime, setDueTime,
    vehicleId, setVehicleId, driverUserId, setDriverUserId, attachments, handlePickFiles, removeAttachment, openFilePicker,
    fileInputRef, isSubmitting, handleSubmit,
    linkableInterventions, selectedIntervention, selectedEmployeeObjs,
    canGoNext, nextStep, prevStep, goToStep,
  }
}

// ─── Pure helpers (extracted to reduce CC) ────────────────────────────────────

function buildFallbackDescription(missionType, selectedIntervention, interventionId) {
  if (missionType === 'Intervention' && selectedIntervention?.request) {
    return String(selectedIntervention.request).trim()
  }
  const suffix = interventionId ? ` — ${interventionId}` : ''
  return `Mission ${missionType}${suffix}`
}

function resolveDriver(selectedEmployeeObjs, vehicleId, driverChoice) {
  if (!vehicleId || selectedEmployeeObjs.length === 0) return ''
  if (selectedEmployeeObjs.length === 1) return String(selectedEmployeeObjs[0].id)
  return selectedEmployeeObjs.some((e) => String(e.id) === String(driverChoice)) ? String(driverChoice) : ''
}

function validateSubmission({ selectedEmployeeObjs, missionType, formData, vehicleId, driverUserId }) {
  if (selectedEmployeeObjs.length === 0) return 'Veuillez sélectionner au moins un technicien valide.'
  const cleanedMissionType = String(missionType || '').trim()
  if (!cleanedMissionType) return 'Veuillez sélectionner un type de mission.'
  if (!String(formData.title || '').trim()) return 'Le titre de la mission est requis.'
  if (!String(formData.description || '').trim() && cleanedMissionType !== 'Intervention') return 'La description de la mission est requise.'
  if (selectedEmployeeObjs.length > 1 && vehicleId && !driverUserId) return 'Désignez le chauffeur du véhicule parmi les techniciens sélectionnés.'
  return null
}

function navigateAfterSubmit(navigate, createdMissions, assignmentGroupId) {
  const highlightMissionId = createdMissions.length > 0 ? String(createdMissions[0]?.id || '') : ''
  const highlightGroupId = assignmentGroupId ? String(assignmentGroupId) : ''
  const params = new URLSearchParams()
  params.set('toast', 'assigned')
  if (highlightMissionId) params.set('highlight', highlightMissionId)
  if (highlightGroupId) params.set('highlightGroup', highlightGroupId)
  navigate(`/missions?${params.toString()}`, {
    state: { toast: 'assigned', highlight: highlightMissionId, highlightGroup: highlightGroupId },
  })
}

function finalizeAfterSubmit({ createdMissions, missionType, formData, selectedNames, attachments }) {
  if (createdMissions.length === 0) return
  void (async () => {
    try {
      if (missionType === 'Intervention' && formData.interventionId) {
        await apiFetch(`/interventions/${formData.interventionId}`, {
          method: 'PATCH',
          body: { status: 'ASSIGNED', assignedTo: selectedNames.join(', ') },
          auth: true,
        })
      }
      if (attachments.length > 0) {
        for (const mission of createdMissions) {
          const form = new FormData()
          for (const file of attachments) form.append('files', file)
          const uploadRes = await apiFetch(`/missions/${mission.id}/attachments`, { method: 'POST', body: form, auth: true })
          if (!uploadRes.ok) {
            if (typeof window !== 'undefined') window.sessionStorage.setItem('missions_bg_toast', 'Missions créées, mais erreur lors de l\'upload des fichiers.')
            break
          }
        }
      }
    } catch {
      if (typeof window !== 'undefined') window.sessionStorage.setItem('missions_bg_toast', 'Missions créées, mais une étape de finalisation a échoué (upload / mise à jour).')
    }
  })()
}
