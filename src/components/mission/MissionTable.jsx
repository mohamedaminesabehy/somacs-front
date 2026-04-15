import { forwardRef, useImperativeHandle, useState, useEffect, useCallback, useRef } from 'react'
import { AlertCircle, Package, ClipboardList, Users, Eye, Edit, Trash2, MapPin, Building2, Phone, Calendar, Wrench, Paperclip, FileText, Clock, UserCheck, Hourglass, Link2, Settings, Download } from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import technicien from '../../assets/technicien.avif'

const priorityColors = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-700',
}

const statusColors = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
}

const interventionStatusColors = {
  PENDING: 'bg-amber-100 text-amber-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
}

function getAvatarFromName(name) {
  if (!name) return ''
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

function getStatusColorKey(status) {
  if (status === 'En cours') return 'yellow'
  if (status === 'Terminée') return 'green'
  if (status === 'Bloquée') return 'red'
  return 'blue'
}

function getGroupedEmployeeNames(mission) {
  const fromDisplay = String(mission?.employeeDisplay || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
  const fromArray = Array.isArray(mission?.groupedEmployees)
    ? mission.groupedEmployees.map((name) => String(name || '').trim()).filter(Boolean)
    : []
  const primary = String(mission?.employee || '').trim()
  return Array.from(new Set([...fromDisplay, ...fromArray, primary].filter(Boolean)))
}

function getGroupedEmployeeStatuses(mission) {
  const rows = Array.isArray(mission?.groupedEmployeeStatuses) ? mission.groupedEmployeeStatuses : []
  if (rows.length > 0) {
    return rows
      .map((row) => ({
        name: String(row?.employeeName || '').trim(),
        status: String(row?.status || '').trim() || 'À faire',
        notes: String(row?.notes || '').trim(),
      }))
      .filter((row) => row.name)
  }

  const names = getGroupedEmployeeNames(mission)
  return names.map((name) => ({
    name,
    status: String(mission?.status || 'À faire'),
    notes: String(mission?.notes || '').trim(),
  }))
}

function MissionTableInner(props, ref) {
  const {
    missions: missionsProp,
    onMissionsChanged,
    onRequestDelete,
    highlightMissionId,
    highlightAssignmentGroupId,
  } = props || {}
  const [missions, setMissions] = useState([])
  const [interventionsList, setInterventionsList] = useState([])
  const [employeeUsers, setEmployeeUsers] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [formMissionId, setFormMissionId] = useState(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formEmployee, setFormEmployee] = useState('')
  const [formPriority, setFormPriority] = useState('Moyenne')
  const [formDueDate, setFormDueDate] = useState('')
  const [formDueTime, setFormDueTime] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formStatus, setFormStatus] = useState('À faire')
  const [formEmployeeIds, setFormEmployeeIds] = useState([]) // NOUVEAU: array d'IDs sélectionnés

  const [missionType, setMissionType] = useState('Normal')
  const [selectedInterventionId, setSelectedInterventionId] = useState('')
  const [formSite, setFormSite] = useState('')
  const [formAddress, setFormAddress] = useState('')

  const [existingAttachments, setExistingAttachments] = useState([])
  const [newAttachments, setNewAttachments] = useState([])

  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewMission, setViewMission] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const highlightRowRef = useRef(null)

  const displayMissions = Array.isArray(missionsProp) ? missionsProp : missions
  const activeHighlightMissionId = String(highlightMissionId || '').trim()
  const activeHighlightGroupId = String(highlightAssignmentGroupId || '').trim()
  const hasHighlight = Boolean(activeHighlightMissionId || activeHighlightGroupId)

  const fetchMissions = useCallback(async () => {
    try {
      const response = await apiFetch('/missions', { auth: true })
      if (response.ok) {
        const data = await response.json()
        setMissions(data)
      }
    } catch (error) {
      console.error('Error fetching missions:', error)
    }
  }, [])

  const fetchInterventions = useCallback(async () => {
    try {
      const response = await apiFetch('/interventions', { auth: true })
      if (response.ok) {
        const data = await response.json()
        setInterventionsList(data)
      }
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
      const normalized = users
        .filter((u) => u && u.isActive !== false)
        .map((u) => ({
          id: u.id,
          name: u.name,
        }))
      setEmployeeUsers(normalized)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const t = window.setTimeout(() => {
      if (!Array.isArray(missionsProp)) {
        void fetchMissions()
      }
      void fetchInterventions()
      void fetchEmployees()
    }, 0)
    return () => window.clearTimeout(t)
  }, [fetchMissions, fetchInterventions, fetchEmployees, missionsProp])

  // Only show PENDING and ASSIGNED interventions in the "Lier à une intervention" dropdown
  const linkableInterventions = interventionsList.filter(i => i.status === 'PENDING' || i.status === 'ASSIGNED')

  const employeeOptions = employeeUsers
  const selectedIntervention = linkableInterventions.find(i => i.id === selectedInterventionId)

  const totalMissions = displayMissions.length
  const totalPages = Math.max(1, Math.ceil(totalMissions / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedMissions = displayMissions.slice(startIndex, endIndex)

  useEffect(() => {
    if (!hasHighlight) return
    const idx = displayMissions.findIndex((m) => {
      if (activeHighlightMissionId && String(m?.id) === activeHighlightMissionId) return true
      if (activeHighlightGroupId && String(m?.assignmentGroupId || '').trim() === activeHighlightGroupId) return true
      return false
    })
    if (idx < 0) return
    const nextPage = Math.floor(idx / pageSize) + 1
    if (nextPage === currentPage) return
    const t = window.setTimeout(() => setCurrentPage(nextPage), 0)
    return () => window.clearTimeout(t)
  }, [activeHighlightGroupId, activeHighlightMissionId, currentPage, displayMissions, hasHighlight, pageSize])

  useEffect(() => {
    if (!hasHighlight) return
    const t = window.setTimeout(() => {
      if (highlightRowRef.current?.scrollIntoView) {
        highlightRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 80)
    return () => window.clearTimeout(t)
  }, [hasHighlight, paginatedMissions.length, safeCurrentPage])

  const handleOpenCreateModal = () => {
    setModalMode('create')
    setFormMissionId(null)
    setFormTitle('')
    setFormDescription('')
    setFormEmployee('') // Vider pour forcer nouvelle sélection
    setFormEmployeeIds([]) // NOUVEAU: array vide
    setFormPriority('Moyenne')
    setFormDueDate('')
    setFormDueTime('')
    setFormNotes('')
    setFormStatus('À faire')
    setMissionType('Normal')
    setSelectedInterventionId('')
    setFormSite('')
    setFormAddress('')
    setExistingAttachments([])
    setNewAttachments([])
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (mission) => {
    setModalMode('edit')
    setFormMissionId(mission.id)
    setFormTitle(mission.title)
    setFormDescription(mission.description)
    setFormEmployee(
      mission.employeeUserId
        ? String(mission.employeeUserId)
        : employeeUsers.find((u) => u.name === mission.employee)?.id
          ? String(employeeUsers.find((u) => u.name === mission.employee).id)
          : '',
    )
    setFormPriority(mission.priority)
    setFormDueDate(mission.dueDate)
    setFormDueTime(mission.dueTime || '')
    setFormNotes(mission.notes || '')
    setFormStatus(mission.status || 'À faire')
    setMissionType(mission.type || 'Normal')
    setFormSite(mission.site || '')
    setFormAddress(mission.address || '')
    setSelectedInterventionId(mission.interventionId || '')
    setExistingAttachments(Array.isArray(mission.attachments) ? mission.attachments : [])
    setNewAttachments([])
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handlePickAttachments = (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const maxBytes = 10 * 1024 * 1024
    const allowed = files.filter((f) => f.size <= maxBytes)
    if (allowed.length !== files.length) {
      alert('Certains fichiers dépassent 10MB et ont été ignorés.')
    }

    setNewAttachments((prev) => {
      const next = [...prev, ...allowed].slice(0, 10)
      const uniq = new Map()
      for (const f of next) {
        const key = `${f.name}_${f.size}_${f.lastModified}`
        if (!uniq.has(key)) uniq.set(key, f)
      }
      return Array.from(uniq.values())
    })

    event.target.value = ''
  }

  const removeNewAttachment = (file) => {
    setNewAttachments((prev) =>
      prev.filter(
        (f) => !(f.name === file.name && f.size === file.size && f.lastModified === file.lastModified),
      ),
    )
  }

  const removeExistingAttachment = (publicId) => {
    setExistingAttachments((prev) => prev.filter((a) => a.publicId !== publicId))
  }

  const handleSubmitModal = async (event) => {
    event.preventDefault()

    if (!formTitle || !formDescription) {
      alert('Veuillez remplir le titre et la description.')
      return
    }

    // Support PLUSIEURS employés
    const hasMultipleEmployees = Array.isArray(formEmployeeIds) && formEmployeeIds.length > 0
    const hasSingleEmployee = formEmployee && String(formEmployee).trim() !== ''

    if (!hasMultipleEmployees && !hasSingleEmployee) {
      alert('Veuillez sélectionner au moins un employé.')
      return
    }

    if (missionType === 'Intervention' && !selectedInterventionId) {
      alert('Veuillez sélectionner une intervention.')
      return
    }

    // CAS 1: PLUSIEURS employés
    if (hasMultipleEmployees) {
      const baseMission = {
        title: formTitle,
        description: formDescription,
        priority: formPriority,
        status: 'À faire',
        dueDate: formDueDate || "Aujourd'hui",
        dueTime: formDueTime || null,
        notes: formNotes,
        type: missionType,
        site: missionType === 'Normal' ? formSite : selectedIntervention?.client,
        address: missionType === 'Normal' ? formAddress : 'N/A',
        interventionId: missionType === 'Intervention' ? selectedInterventionId : null,
        employeeUserIds: formEmployeeIds, // ← ARRAY D'IDs
      }

      try {
        const response = await apiFetch('/missions', {
          method: 'POST',
          body: baseMission,
          auth: true,
        })

        if (response.ok) {
          if (typeof onMissionsChanged === 'function') onMissionsChanged()
          else fetchMissions()
          setIsModalOpen(false)
        }
      } catch (error) {
        console.error('Error saving missions:', error)
      }
      return
    }

    // CAS 2: UN SEUL employé (backward compatible)
    const selectedEmployee = employeeUsers.find((u) => String(u.id) === String(formEmployee)) || null
    const selectedEmployeeName = selectedEmployee?.name || ''

    const baseMission = {
      title: formTitle,
      description: formDescription,
      employee: selectedEmployeeName,
      employeeUserId: selectedEmployee ? Number(selectedEmployee.id) : null,
      priority: formPriority,
      status: modalMode === 'create' ? 'À faire' : formStatus,
      dueDate: formDueDate || "Aujourd'hui",
      dueTime: formDueTime || null,
      notes: formNotes,
      type: missionType,
      site: missionType === 'Normal' ? formSite : selectedIntervention?.client,
      address: missionType === 'Normal' ? formAddress : 'N/A',
      interventionId: missionType === 'Intervention' ? selectedInterventionId : null,
    }

    try {
      const response = await apiFetch(
        modalMode === 'create' ? '/missions' : `/missions/${formMissionId}`,
        {
          method: modalMode === 'create' ? 'POST' : 'PATCH',
          body: modalMode === 'edit' ? { ...baseMission, attachments: existingAttachments } : baseMission,
          auth: true,
        },
      )

      if (response.ok) {
        const saved = await response.json().catch(() => null)
        const missionId = saved?.id || formMissionId

        if (missionId && newAttachments.length > 0) {
          const form = new FormData()
          for (const file of newAttachments) {
            form.append('files', file)
          }
          const uploadRes = await apiFetch(`/missions/${missionId}/attachments`, {
            method: 'POST',
            body: form,
            auth: true,
          })
          if (!uploadRes.ok) {
            alert('Mission enregistrée, mais erreur lors de l’upload des fichiers.')
          }
        }

        // Si c'est une intervention, on met à jour son statut dans le backend aussi
        if (missionType === 'Intervention' && selectedInterventionId) {
          await apiFetch(`/interventions/${selectedInterventionId}`, {
            method: 'PATCH',
            body: { status: 'ASSIGNED', assignedTo: selectedEmployeeName },
            auth: true,
          })
          fetchInterventions()
        }
        if (typeof onMissionsChanged === 'function') onMissionsChanged()
        else fetchMissions()
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error('Error saving mission:', error)
    }
  }

  useImperativeHandle(ref, () => ({
    openCreateModal: handleOpenCreateModal,
  }))

  const handleOpenViewModal = (mission) => {
    const priorityColor =
      mission.priority === 'Critique'
        ? 'red'
        : mission.priority === 'Haute'
          ? 'orange'
          : mission.priority === 'Moyenne'
            ? 'yellow'
            : 'gray'
    const statusColor =
      mission.status === 'En cours'
        ? 'yellow'
        : mission.status === 'Terminée'
          ? 'green'
          : mission.status === 'Bloquée'
            ? 'red'
            : 'blue'
    setViewMission({ ...mission, priorityColor, statusColor })
    setIsViewOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewOpen(false)
    setViewMission(null)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mission</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employé</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priorité</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type de mission</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date mission</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
          {paginatedMissions.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-3">
                    <AlertCircle size={22} className="text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Il n&apos;y a pas de mission correspondant à vos filtres.
                  </p>
                </div>
              </td>
            </tr>
          ) : null}
          {paginatedMissions.map((mission) => {
            const IconComponent = mission.type === 'Intervention' ? Wrench : ClipboardList
            const priorityColor = mission.priority === 'Critique' ? 'red' : mission.priority === 'Haute' ? 'orange' : mission.priority === 'Moyenne' ? 'yellow' : 'gray'
            const statusColor = getStatusColorKey(mission.status)
            const employeeDisplay = mission.employeeDisplay || mission.employee
            const groupedStatuses = getGroupedEmployeeStatuses(mission)
            const isGroupedMission = groupedStatuses.length > 1
            const avatar = getAvatarFromName(employeeDisplay)
            const isHighlighted =
              (activeHighlightMissionId && String(mission?.id) === activeHighlightMissionId) ||
              (activeHighlightGroupId && String(mission?.assignmentGroupId || '').trim() === activeHighlightGroupId)

            return (
              <tr
                key={mission.id}
                ref={isHighlighted ? highlightRowRef : null}
                className={`transition-colors ${
                  isHighlighted ? 'bg-emerald-50 ring-2 ring-emerald-200 animate-pulse' : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mission.type === 'Intervention' ? 'bg-blue-50' : 'bg-gray-100'}`}>
                      <IconComponent size={18} className={`${mission.type === 'Intervention' ? 'text-[#0052CC]' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{mission.title}</p>
                      <p className="text-sm text-gray-500">{mission.description}</p>
                      {mission.type === 'Intervention' && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md">
                          <Link2 size={10} /> Intervention
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-bold">
                      {avatar}
                    </div>
                    <span className="text-sm text-gray-900">{employeeDisplay}</span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${priorityColors[priorityColor]}`}>
                    {mission.priority === 'Critique' && '⚠️ '}
                    {mission.priority === 'Haute' && '↗ '}
                    {mission.priority === 'Moyenne' && '– '}
                    {mission.priority === 'Basse' && '↘ '}
                    {mission.priority}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  {isGroupedMission ? (
                    <div className="space-y-1.5 min-w-[180px]">
                      {groupedStatuses.map((entry) => {
                        const entryStatusColor = getStatusColorKey(entry.status)
                        return (
                        <div key={`${mission.id}_${entry.name}`} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-700 font-medium truncate">{entry.name}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${statusColors[entryStatusColor]}`}>
                            {entry.status === 'En cours' && '●'}
                            {entry.status === 'À faire' && '●'}
                            {entry.status === 'Terminée' && '✓'}
                            {entry.status === 'Bloquée' && '⊗'}
                            {' '}
                            {entry.status}
                          </span>
                        </div>
                      )})}
                    </div>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[statusColor]}`}>
                      {mission.status === 'En cours' && '●'}
                      {mission.status === 'À faire' && '●'}
                      {mission.status === 'Terminée' && '✓'}
                      {mission.status === 'Bloquée' && '⊗'}
                      {' '}
                      {mission.status}
                    </span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4">
                  {mission.type === 'Intervention' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[#0052CC] bg-blue-50 border border-blue-100">
                      <Wrench size={12} />
                      Intervention S.A.V
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200">
                      <ClipboardList size={12} />
                      Normal
                    </span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{mission.dueDate}</p>
                  {mission.dueTime && <p className="text-sm text-red-600">{mission.dueTime}</p>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => handleOpenViewModal(mission)}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => handleOpenEditModal(mission)}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded"
                      onClick={async () => {
                        if (typeof onRequestDelete === 'function') {
                          onRequestDelete(mission)
                          return
                        }
                        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) return
                        try {
                          const response = await apiFetch(`/missions/${mission.id}`, {
                            method: 'DELETE',
                            auth: true,
                          })
                          if (response.ok) {
                            if (typeof onMissionsChanged === 'function') onMissionsChanged()
                            else fetchMissions()
                          }
                        } catch (error) {
                          console.error('Error deleting mission:', error)
                        }
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
          </tbody>
        </table>
      </div>
      {totalMissions > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs sm:text-sm text-gray-600">
            Affichage de{' '}
            <span className="font-medium">
              {startIndex + 1}–{Math.min(endIndex, totalMissions)}
            </span>{' '}
            sur <span className="font-medium">{totalMissions}</span> missions
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border ${
                safeCurrentPage === 1
                  ? 'text-gray-400 border-gray-200 bg-white cursor-not-allowed'
                  : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              Précédent
            </button>
            <span className="text-xs sm:text-sm text-gray-600">
              Page <span className="font-medium">{safeCurrentPage}</span> sur{' '}
              <span className="font-medium">{totalPages}</span>
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border ${
                safeCurrentPage === totalPages
                  ? 'text-gray-400 border-gray-200 bg-white cursor-not-allowed'
                  : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* ═══ CREATE/EDIT MODAL ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <ClipboardList size={22} className="text-[#0052CC]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalMode === 'create' ? 'Ajouter une mission' : 'Modifier la mission'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {modalMode === 'create'
                      ? 'Remplissez les détails pour assigner une nouvelle mission.'
                      : 'Mettez à jour les informations de la mission existante.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Trash2 size={20} className="rotate-45" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="mission-form" onSubmit={handleSubmitModal} className="space-y-8">
                {/* Configuration Section */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Wrench size={14} />
                    Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Type de mission</label>
                      <select
                        value={missionType}
                        onChange={(e) => { setMissionType(e.target.value); setSelectedInterventionId('') }}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white transition-all hover:border-gray-300"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Intervention">Intervention SAV</option>
                      </select>
                    </div>
                    {missionType === 'Intervention' && (
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Link2 size={14} className="text-[#0052CC]" />
                          Lier à une intervention
                        </label>
                        <select
                          value={selectedInterventionId}
                          onChange={(e) => setSelectedInterventionId(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white transition-all hover:border-gray-300"
                          required
                        >
                          <option value="">Sélectionner une intervention</option>
                          <optgroup label="🕒 En attente (non assignées)">
                            {linkableInterventions.filter(i => i.status === 'PENDING').map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.id} — {inv.client} — {inv.machine}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="✅ Affectées (déjà assignées)">
                            {linkableInterventions.filter(i => i.status === 'ASSIGNED').map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.id} — {inv.client} — {inv.machine} ({inv.assignedTo})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    )}
                  </div>

                  {missionType === 'Intervention' && selectedIntervention && (
                    <div className="mt-4 p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-xl border border-blue-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#0052CC] font-bold text-xs uppercase tracking-wider">
                          <AlertCircle size={14} />
                          Détails de l’intervention
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${interventionStatusColors[selectedIntervention.status] || 'bg-gray-100 text-gray-600'}`}>
                          {selectedIntervention.status === 'PENDING' && <Hourglass size={10} />}
                          {selectedIntervention.status === 'ASSIGNED' && <UserCheck size={10} />}
                          {selectedIntervention.statusLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Client</label>
                          <p className="text-sm font-semibold text-gray-800">{selectedIntervention.client}</p>
                          <p className="text-[10px] text-gray-400 font-semibold">{selectedIntervention.clientCode}</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Équipement</label>
                          <p className="text-sm font-semibold text-gray-800">{selectedIntervention.machine}</p>
                          <p className="text-[10px] text-gray-400 font-semibold">{selectedIntervention.type}</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Téléphone</label>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                            <Phone size={14} className="text-blue-300" />
                            {selectedIntervention.phone}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Date création</label>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                            <Calendar size={14} className="text-blue-300" />
                            {selectedIntervention.date}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Demande / problème</label>
                          <p className="text-sm text-gray-700 bg-white/60 p-2.5 rounded-lg border border-blue-50 italic">{selectedIntervention.request}</p>
                        </div>
                        {selectedIntervention.assignedTo && (
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Déjà assignée à</label>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[10px] font-bold">
                                {getAvatarFromName(selectedIntervention.assignedTo)}
                              </div>
                              <span className="text-sm font-semibold text-gray-800">{selectedIntervention.assignedTo}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                {/* Details Section */}
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText size={14} />
                    Détails de la mission
                  </h3>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      {missionType === 'Normal' ? 'Titre de la mission' : 'Titre de la sous-mission'}
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(event) => setFormTitle(event.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all hover:border-gray-300"
                      placeholder={missionType === 'Normal' ? "Ex: Maintenance préventive..." : "Ex: Vérification câblage..."}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      {missionType === 'Normal' ? 'Description détaillée' : 'Description technique'}
                    </label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(event) => setFormDescription(event.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] resize-none transition-all hover:border-gray-300"
                      placeholder="Décrivez précisément les actions à réaliser..."
                      required
                    />
                  </div>

                  {missionType === 'Normal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Building2 size={16} className="text-gray-400" />
                          Site
                        </label>
                        <input
                          type="text"
                          value={formSite}
                          onChange={(e) => setFormSite(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all hover:border-gray-300"
                          placeholder="Nom du site"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                          <MapPin size={16} className="text-gray-400" />
                          Adresse
                        </label>
                        <input
                          type="text"
                          value={formAddress}
                          onChange={(e) => setFormAddress(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all hover:border-gray-300"
                          placeholder="Adresse complète"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Notes supplémentaires (optionnel)</label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] resize-none transition-all hover:border-gray-300"
                      placeholder="Consignes particulières, précautions, contacts sur place..."
                    />
                  </div>
                </section>

                {/* Assignment & Timing Section */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users size={14} />
                    Assignation & Délai
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            {formEmployeeIds.length > 0 ? 'Employés sélectionnés' : 'Employé assigné (mode simple)'}
                          </label>
                          {formEmployeeIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setFormEmployeeIds([])}
                              className="text-xs font-bold text-red-600 hover:text-red-700"
                            >
                              Annuler sélection multiple
                            </button>
                          )}
                        </div>
                        
                        {/* Mode SIMPLE: Un seul employé */}
                        {formEmployeeIds.length === 0 && (
                          <select
                            value={formEmployee}
                            onChange={(event) => setFormEmployee(event.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white transition-all hover:border-gray-300"
                          >
                            <option value="">Sélectionner un employé OU utiliser la sélection multiple ci-dessous</option>
                            {employeeOptions.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {/* Mode MULTIPLE: Checkboxes */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-2 max-h-64 overflow-y-auto">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Sélectionner PLUSIEURS employés pour créer une mission groupée:
                          </p>
                          {employeeOptions.length === 0 ? (
                            <p className="text-sm text-gray-500">Aucun employé disponible</p>
                          ) : (
                            employeeOptions.map((employee) => (
                              <label key={employee.id} className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={formEmployeeIds.includes(employee.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormEmployeeIds((prev) => [...prev, employee.id])
                                    } else {
                                      setFormEmployeeIds((prev) => prev.filter((id) => id !== employee.id))
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-[#0052CC] focus:ring-2 focus:ring-[#0052CC] cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 font-medium">{employee.name}</span>
                                {formEmployeeIds.includes(employee.id) && (
                                  <span className="ml-auto text-xs font-bold text-[#0052CC] bg-blue-50 px-2 py-1 rounded">✓ Sélectionné</span>
                                )}
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                      {modalMode === 'edit' && (
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-gray-700">Statut</label>
                          <select
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white transition-all hover:border-gray-300"
                          >
                            <option value="À faire">À faire</option>
                            <option value="En cours">En cours</option>
                            <option value="Terminée">Terminée</option>
                            <option value="Bloquée">Bloquée</option>
                          </select>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700">Priorité</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Critique', 'Haute', 'Moyenne', 'Basse'].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setFormPriority(p)}
                              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                                formPriority === p
                                  ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-sm'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700">Date de mission</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={formDueDate}
                            onChange={(event) => setFormDueDate(event.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all hover:border-gray-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400" />
                          Heure de début
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={formDueTime}
                            onChange={(event) => setFormDueTime(event.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] transition-all hover:border-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Attachments Section */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Paperclip size={14} />
                    Pièces jointes
                  </h3>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
                    className="hidden"
                    id="mission-table-attachments"
                    onChange={handlePickAttachments}
                  />
                  <label
                    htmlFor="mission-table-attachments"
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#0052CC] hover:bg-blue-50/50 transition-all cursor-pointer group bg-gray-50/50 block"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[#0052CC] transition-colors">
                        <FileText size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 group-hover:text-[#0052CC] transition-colors">
                          Cliquez pour ajouter des fichiers
                        </p>
                        <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                      </div>
                    </div>
                  </label>

                  {modalMode === 'edit' && existingAttachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documents existants</p>
                      {existingAttachments.map((a) => (
                        <div
                          key={a.publicId}
                          className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">
                              {a.originalFilename || a.publicId}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">{a.url}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-[#0052CC] hover:underline"
                            >
                              Ouvrir
                            </a>
                            <button
                              type="button"
                              onClick={() => removeExistingAttachment(a.publicId)}
                              className="text-[10px] font-bold text-red-600 hover:text-red-700"
                            >
                              Retirer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {newAttachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nouveaux fichiers</p>
                      {newAttachments.map((file) => (
                        <div
                          key={`${file.name}_${file.size}_${file.lastModified}`}
                          className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{file.name}</p>
                            <p className="text-[10px] text-gray-500">{Math.ceil(file.size / 1024)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNewAttachment(file)}
                            className="text-[10px] font-bold text-red-600 hover:text-red-700"
                          >
                            Retirer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 sticky bottom-0">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-white hover:shadow-sm transition-all active:scale-95"
              >
                Annuler
              </button>
              <button
                form="mission-form"
                type="submit"
                className="px-8 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-semibold hover:bg-[#0042a3] hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
              >
                {modalMode === 'create' ? 'Créer la mission' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VIEW MODAL ═══ */}
      {isViewOpen && viewMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* View Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <img
                  src={technicien}
                  alt=""
                  aria-hidden="true"
                  className="w-12 h-12 rounded-full object-cover shadow-inner"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{viewMission.employeeDisplay || viewMission.employee}</h2>
                  <p className="text-xs text-gray-500 font-medium">Employé(s) assigné(s)</p>
                </div>
              </div>
              <button
                onClick={handleCloseViewModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Trash2 size={20} className="rotate-45" />
              </button>
            </div>

            {/* View Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Titre de la mission</p>
                  <p className="text-base font-semibold text-gray-900 leading-tight">{viewMission.title}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                    "{viewMission.description}"
                  </p>
                </div>

                {viewMission.interventionId && (
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5">Intervention liée</p>
                    <span className="font-mono text-sm font-bold text-[#0052CC]">{viewMission.interventionId}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Priorité</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${priorityColors[viewMission.priorityColor]}`}
                    >
                      {viewMission.priority === 'Critique' && '⚠️ '}
                      {viewMission.priority === 'Haute' && '↗ '}
                      {viewMission.priority === 'Moyenne' && '– '}
                      {viewMission.priority === 'Basse' && '↘ '}
                      {viewMission.priority}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Statut</p>
                    {getGroupedEmployeeStatuses(viewMission).length > 1 ? (
                      <div className="space-y-1.5">
                        {getGroupedEmployeeStatuses(viewMission).map((entry) => {
                          const entryStatusColor = getStatusColorKey(entry.status)
                          return (
                            <div key={`${viewMission.id}_${entry.name}`} className="flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-700 font-medium truncate">{entry.name}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${statusColors[entryStatusColor]}`}>
                                {entry.status === 'En cours' && '● '}
                                {entry.status === 'À faire' && '● '}
                                {entry.status === 'Terminée' && '✓ '}
                                {entry.status === 'Bloquée' && '⊗ '}
                                {entry.status}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[viewMission.statusColor]}`}
                      >
                        {viewMission.status === 'En cours' && '● '}
                        {viewMission.status === 'À faire' && '● '}
                        {viewMission.status === 'Terminée' && '✓ '}
                        {viewMission.status === 'Bloquée' && '⊗ '}
                        {viewMission.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-blue-50 rounded-lg">
                      <Calendar size={16} className="text-[#0052CC]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Échéance</p>
                      <p className="text-sm font-semibold text-gray-900">{viewMission.dueDate}</p>
                      {viewMission.dueTime && <p className="text-xs text-red-500 font-medium">{viewMission.dueTime}</p>}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-orange-50 rounded-lg">
                      <FileText size={16} className="text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Note technicien</p>
                      {getGroupedEmployeeStatuses(viewMission).length > 1 ? (
                        <div className="mt-1 space-y-1.5">
                          {getGroupedEmployeeStatuses(viewMission).map((entry) => (
                            <div key={`${viewMission.id}_note_${entry.name}`} className="flex items-start justify-between gap-3">
                              <span className="text-xs text-gray-700 font-semibold whitespace-nowrap">{entry.name}</span>
                              <span className="text-xs text-gray-900 break-words text-right">{entry.notes || '—'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-gray-900 break-words">
                          {viewMission.notes || '—'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {Array.isArray(viewMission.attachments) && viewMission.attachments.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documents</p>
                      <div className="text-[10px] font-bold text-gray-400 truncate">
                        {(viewMission.employeeDisplay || viewMission.employee)} · {viewMission.dueDate}{viewMission.dueTime ? ` ${viewMission.dueTime}` : ''}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {viewMission.attachments.map((a) => (
                        <div
                          key={a.publicId}
                          className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                              {a.resourceType === 'image' ? (
                                <img
                                  src={a.url}
                                  alt={a.originalFilename || ''}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FileText size={18} className="text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {a.originalFilename || a.publicId}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">
                                Mission: {viewMission.title}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                <span className="truncate">{a.bytes ? `${Math.ceil(a.bytes / 1024)} KB` : '—'}</span>
                                <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                <span className="truncate">{a.createdAt ? new Date(a.createdAt).toLocaleDateString('fr-FR') : '—'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                              title="Ouvrir"
                            >
                              <Eye size={16} />
                            </a>
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                              title="Télécharger"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(viewMission.site || viewMission.address) && (
                  <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {viewMission.site && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Building2 size={14} className="text-gray-400" />
                        <span className="font-medium">{viewMission.site}</span>
                      </div>
                    )}
                    {viewMission.address && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="font-medium break-words">{viewMission.address}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* View Footer */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all active:scale-95 shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MissionTable = forwardRef(MissionTableInner)

export default MissionTable
