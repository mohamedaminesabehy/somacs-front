import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react'
import { AlertCircle, ClipboardList, Users, Eye, Edit, Trash2, MapPin, Building2, Phone, Calendar, Wrench, Paperclip, FileText, Clock, UserCheck, Hourglass, Link2, Download, Truck, ChevronLeft, ChevronRight, CheckCircle2, UploadCloud } from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import { getAvatarFromName } from '../../utils/format'
import { useMissionTableData } from './useMissionTableData'
import {
  interventionStatusColors,
  getGroupedEmployeeStatuses,
  truncateText,
  getMissionDisplayData,
  validateMissionForm,
  updateMission,
  submitMissionEdit,
} from './missionTable.helpers'
import Modal from '../ui/Modal'
import { Link } from 'react-router-dom'
import { Toast } from '../ui/DataKit'
import { InlineAlert, SkeletonLines } from '../ui/Feedback'
import StatusBadge from '../ui/StatusBadge'
import MissionViewBadge from './MissionViewBadge'
import { EmptyState as UiEmptyState } from '../ui/Feedback'

function MissionEmptyState() {
  return (
    <UiEmptyState
      icon={AlertCircle}
      title="Aucune mission"
      description="Aucune mission ne correspond à vos filtres. Modifiez la recherche ou réinitialisez les filtres."
    />
  )
}

const PRIORITY_OPTIONS = [
  { value: 'Critique', dot: 'bg-red-500' },
  { value: 'Haute', dot: 'bg-amber-500' },
  { value: 'Moyenne', dot: 'bg-brand-600' },
  { value: 'Basse', dot: 'bg-slate-400' },
]

function MissionTableInner(props, ref) {
  const {
    missions: missionsProp,
    onMissionsChanged,
    onRequestDelete,
    highlightMissionId,
    highlightAssignmentGroupId,
    panelsOnly = false,
    currentUser,
  } = props || {}
  const canEdit = Boolean(currentUser?.role) && String(currentUser.role).toLowerCase() !== 'technicien'
  const [panelLoading, setPanelLoading] = useState(false)
  const [panelError, setPanelError] = useState('')
  const [saveToast, setSaveToast] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formVehicleId, setFormVehicleId] = useState('')
  const [formDriverId, setFormDriverId] = useState('')
  const [vehicles, setVehicles] = useState([])
  const [originalMission, setOriginalMission] = useState(null)
  const requestId = useRef(0)
  const { missions, fetchMissions, interventionsList, employeeUsers, dataError } = useMissionTableData(missionsProp, canEdit)
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

  const [formError, setFormError] = useState('')
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewMission, setViewMission] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const highlightRowRef = useRef(null)

  const displayMissions = Array.isArray(missionsProp) ? missionsProp : missions
  const activeHighlightMissionId = String(highlightMissionId || '').trim()
  const activeHighlightGroupId = String(highlightAssignmentGroupId || '').trim()
  const hasHighlight = Boolean(activeHighlightMissionId || activeHighlightGroupId)

  // Only show PENDING and ASSIGNED interventions in the "Lier à une intervention" dropdown
  const linkableInterventions = interventionsList.filter(i => i.status === 'PENDING' || i.status === 'ASSIGNED' || i.id === selectedInterventionId)

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

  const handleOpenEditModal = async (source) => {
    if (!canEdit) return
    const id = ++requestId.current
    setIsViewOpen(false)
    setIsModalOpen(true)
    setPanelLoading(true)
    setOriginalMission(null)
    setFormError('')
    let mission
    try {
      const response = await apiFetch(`/missions/${source.id}`, { auth: true, noCache: true })
      if (!response.ok) throw new Error('Impossible de charger la mission pour modification.')
      mission = await response.json()
      const vehicleResponse = await apiFetch('/vehicles', { auth: true, noCache: true })
      if (!vehicleResponse.ok) throw new Error('Impossible de vérifier la disponibilité des véhicules.')
      const vehicleData = await vehicleResponse.json()
      if (id !== requestId.current) return
      setVehicles(Array.isArray(vehicleData) ? vehicleData : [])
    } catch (error) {
      if (id === requestId.current) { setFormError(error.message); setPanelLoading(false) }
      return
    }
    setPanelLoading(false)
    setOriginalMission(mission)
    setFormEmployeeIds((mission.team?.length ? mission.team.map(t => t.userId) : mission.employeeUserId ? [mission.employeeUserId] : []).map(Number))
    setFormVehicleId(mission.vehicleId ? String(mission.vehicleId) : '')
    setFormDriverId(mission.driverUserId ? String(mission.driverUserId) : '')
    setModalMode('edit')
    setFormMissionId(mission.id)
    setFormTitle(mission.title || '')
    setFormDescription(mission.description || '')
    setFormEmployee(
      mission.employeeUserId
        ? String(mission.employeeUserId)
        : employeeUsers.find((u) => u.name === mission.employee)?.id
          ? String(employeeUsers.find((u) => u.name === mission.employee).id)
          : '',
    )
    setFormPriority(mission.priority)
    setFormDueDate(mission.dueDate || '')
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
    if (isSaving) return
    requestId.current += 1
    setFormError('')
    setIsModalOpen(false)
  }

  const handlePickAttachments = (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const maxBytes = 10 * 1024 * 1024
    const allowed = files.filter((f) => f.size <= maxBytes)
    if (allowed.length !== files.length) {
      setFormError('Certains fichiers dépassent 10 Mo et ont été ignorés.')
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

    const validationError = validateMissionForm({
      formTitle, formDescription, formEmployeeIds, formEmployee, missionType, selectedInterventionId,
    })
    if (validationError) {
      setFormError(validationError)
      document.getElementById('mission-form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setFormError('')

    const refreshAfterSave = () => {
      if (typeof onMissionsChanged === 'function') return onMissionsChanged()
      return fetchMissions()
    }

    if (isSaving || panelLoading || !canEdit || !originalMission) return
    const teamIds = formEmployeeIds.length ? formEmployeeIds : formEmployee ? [Number(formEmployee)] : []
    const driver = formVehicleId ? (teamIds.length === 1 ? teamIds[0] : Number(formDriverId)) : null
    if (formVehicleId && !teamIds.includes(driver)) {
      setFormError('Désignez le chauffeur parmi les techniciens sélectionnés.')
      return
    }
    setIsSaving(true)
    try {
      await submitMissionEdit({
        save: () => updateMission({
          formMissionId: originalMission.id, formTitle, formDescription, formPriority, formStatus, formDueDate, formDueTime, formNotes,
          missionType, formSite, formAddress, selectedIntervention, selectedInterventionId,
          formEmployeeIds: teamIds, formVehicleId, formDriverId: driver,
          expectedStatus: originalMission.status,
          existingAttachments, newAttachments,
        }),
        closeDrawer: () => setIsModalOpen(false),
        refresh: refreshAfterSave,
      })
      setSaveToast({ type: 'success', message: 'Mission modifiée avec succès.' })
      window.dispatchEvent(new CustomEvent('mission:saved', { detail: { missionId: formMissionId } }))
    } catch (error) {
      setFormError(error.message || 'Impossible d’enregistrer la mission.')
    } finally {
      setIsSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({ openDetails: handleOpenViewModal }))

  async function handleOpenViewModal(mission) {
    const id = ++requestId.current
    setIsModalOpen(false)
    setViewMission(mission)
    setIsViewOpen(true)
    setPanelLoading(true)
    setPanelError('')
    try {
      const res = await apiFetch(`/missions/${mission.id}`, { auth: true, noCache: true })
      if (!res.ok) throw new Error(`Impossible de charger cette mission (HTTP ${res.status}).`)
      const detail = await res.json()
      let intervention = null
      if (detail.interventionId) {
        const linked = await apiFetch(`/interventions/${detail.interventionId}`, { auth: true, noCache: true })
        if (linked.ok) intervention = await linked.json()
      }
      if (requestId.current === id) setViewMission({ ...detail, intervention })
    } catch (error) {
      if (requestId.current === id) setPanelError(error.message)
    } finally {
      if (requestId.current === id) setPanelLoading(false)
    }
  }

  const handleCloseViewModal = () => {
    requestId.current += 1
    setIsViewOpen(false)
    setViewMission(null)
  }

  const handleDeleteMission = async (mission) => {
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
  }

  const renderStatus = (mission, compact = false) => {
    const { groupedStatuses, isGroupedMission } = getMissionDisplayData(mission)
    if (!isGroupedMission) return <StatusBadge status={mission.status} />
    return (
      <ul className={`flex flex-col gap-1.5 ${compact ? '' : 'min-w-[190px]'}`}>
        {groupedStatuses.map((entry) => (
          <li key={`${mission.id}_${entry.name}`} className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium text-ink-soft">{entry.name}</span>
            <StatusBadge status={entry.status} />
          </li>
        ))}
      </ul>
    )
  }

  const renderTypeBadge = (mission) => (
    mission.type === 'Intervention' ? (
      <span className="ui-badge bg-brand-50 text-brand-700 ring-brand-200">
        <Wrench size={11} aria-hidden="true" /> Intervention S.A.V
      </span>
    ) : (
      <span className="ui-badge bg-slate-100 text-slate-700 ring-slate-200">
        <ClipboardList size={11} aria-hidden="true" /> Normal
      </span>
    )
  )

  const isRowHighlighted = (mission) =>
    (activeHighlightMissionId && String(mission?.id) === activeHighlightMissionId) ||
    (activeHighlightGroupId && String(mission?.assignmentGroupId || '').trim() === activeHighlightGroupId)

  const sectionTitle = (Icon, label) => (
    <h3 className="ui-eyebrow mb-3 flex items-center gap-2 text-brand-700">
      <Icon size={13} aria-hidden="true" /> {label}
    </h3>
  )

  return (
    <div className="relative">
      <Toast toast={saveToast} onClose={() => setSaveToast(null)} />
      {!panelsOnly && <>
      {/* Cartes mobile / tablette */}
      <div className="p-3 sm:p-4 lg:hidden">
        {paginatedMissions.length === 0 ? (
          <MissionEmptyState />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {paginatedMissions.map((mission) => {
              const { IconComponent, employeeDisplay, avatar } = getMissionDisplayData(mission)
              const highlighted = isRowHighlighted(mission)
              return (
                <li
                  key={mission.id}
                  ref={highlighted ? highlightRowRef : null}
                  className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-card transition ${highlighted ? 'border-teal-300 ring-2 ring-teal-200' : 'border-line'}`}
                >
                  <div className="flex items-start gap-3 p-4">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${mission.type === 'Intervention' ? 'bg-brand-50 text-brand-700 ring-brand-100' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                      <IconComponent size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => handleOpenViewModal(mission)} className="break-words text-left font-display text-sm font-bold leading-snug text-ink hover:text-brand-700">{mission.title}</button>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-muted" title={mission.description || ''}>{truncateText(mission.description, 80)}</p>
                    </div>
                    <StatusBadge status={mission.priority} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 px-4">
                    {renderTypeBadge(mission)}
                    <span className="ui-badge bg-white text-ink-soft ring-line">
                      <Calendar size={11} aria-hidden="true" /> {mission.dueDate}{mission.dueTime ? ` · ${mission.dueTime}` : ''}
                    </span>
                    {mission.interventionId && <span className="ui-ref">{mission.interventionId}</span>}
                    <MissionViewBadge viewStatus={mission.viewStatus} />
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3 border-t border-slate-100 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">{avatar}</span>
                      <span className="truncate text-xs font-semibold text-ink-soft">{employeeDisplay}</span>
                    </div>
                    <div className="min-w-0 max-w-[55%]">{renderStatus(mission, true)}</div>
                  </div>
                  <div className="mt-auto grid grid-cols-3 divide-x divide-line border-t border-line bg-slate-50/60">
                    <button type="button" onClick={() => handleOpenViewModal(mission)} className="flex h-11 items-center justify-center gap-1.5 text-xs font-semibold text-ink-soft hover:bg-white">
                      <Eye size={14} aria-hidden="true" /> Voir
                    </button>
                    <button type="button" disabled={!canEdit} onClick={() => handleOpenEditModal(mission)} className="flex h-11 items-center justify-center gap-1.5 text-xs font-semibold text-brand-700 hover:bg-white">
                      <Edit size={14} aria-hidden="true" /> Modifier
                    </button>
                    <button type="button" onClick={() => handleDeleteMission(mission)} className="flex h-11 items-center justify-center gap-1.5 text-xs font-semibold text-red-600 hover:bg-white">
                      <Trash2 size={14} aria-hidden="true" /> Supprimer
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Tableau desktop */}
      <div className="hidden min-w-0 lg:block">
        <table className="ui-table table-fixed [&_td]:break-words [&_td]:px-3 [&_th]:px-3">
          <thead>
            <tr>
              <th scope="col" className="w-[30%]">Mission</th>
              <th scope="col" className="w-[20%]">Équipe</th>
              <th scope="col" className="w-[18%]">Statut · Priorité</th>
              <th scope="col" className="w-[17%]">Échéance</th>
              <th scope="col" className="w-[15%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMissions.length === 0 && (
              <tr>
                <td colSpan={5}><MissionEmptyState /></td>
              </tr>
            )}
            {paginatedMissions.map((mission) => {
              const { IconComponent, employeeDisplay, avatar, isGroupedMission, groupedStatuses } = getMissionDisplayData(mission)
              const highlighted = isRowHighlighted(mission)
              return (
                <tr key={mission.id} ref={highlighted ? highlightRowRef : null} onClick={(e) => { if (!e.target.closest('button, a')) handleOpenViewModal(mission) }} className={`cursor-pointer ${highlighted ? 'bg-teal-50/70' : ''}`}>
                  <td className="max-w-[340px]">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${mission.type === 'Intervention' ? 'bg-brand-50 text-brand-700 ring-brand-100' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                        <IconComponent size={17} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <button type="button" onClick={() => handleOpenViewModal(mission)} className="text-left font-semibold text-ink hover:text-brand-700">
                          {mission.title}
                        </button>
                        <p className="mt-1 text-xs text-ink-muted">#{mission.id} · {mission.type === 'Intervention' ? 'Intervention SAV' : 'Mission normale'}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {mission.interventionId && (
                            <span className="ui-ref gap-1"><Link2 size={10} aria-hidden="true" />{mission.interventionId}</span>
                          )}
                          <MissionViewBadge viewStatus={mission.viewStatus} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      {isGroupedMission ? (
                        <span className="flex -space-x-2">
                          {groupedStatuses.slice(0, 3).map((entry) => (
                            <span key={entry.name} title={entry.name} className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white ring-2 ring-white">
                              {getAvatarFromName(entry.name)}
                            </span>
                          ))}
                          {groupedStatuses.length > 3 && (
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-ink-muted ring-2 ring-white">+{groupedStatuses.length - 3}</span>
                          )}
                        </span>
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-white">{avatar}</span>
                      )}
                      <span className="min-w-0 break-words text-xs font-medium text-ink-soft">{employeeDisplay || 'Non renseigné'}</span>
                    </div>
                  </td>
                  <td><div className="flex flex-col items-start gap-1.5"><StatusBadge status={mission.status} /><span className="text-xs text-ink-muted">{mission.priority || 'Non renseigné'}</span></div></td>
                  <td className="whitespace-nowrap">
                    <p className="text-sm font-semibold tabular-nums text-ink">{mission.dueDate}</p>
                    {mission.dueTime && <p className="flex items-center gap-1 text-xs tabular-nums text-ink-muted"><Clock size={11} aria-hidden="true" />{mission.dueTime}</p>}
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <button type="button" onClick={() => handleOpenViewModal(mission)} className="ui-icon-btn h-9 w-9" aria-label={`Voir ${mission.title}`}>
                        <Eye size={16} />
                      </button>
                      <button type="button" disabled={!canEdit} onClick={() => handleOpenEditModal(mission)} className="ui-icon-btn h-9 w-9 hover:bg-brand-50 hover:text-brand-700" aria-label={`Modifier ${mission.title}`}>
                        <Edit size={16} />
                      </button>
                      <button type="button" onClick={() => handleDeleteMission(mission)} className="ui-icon-btn h-9 w-9 hover:bg-red-50 hover:text-red-600" aria-label={`Supprimer ${mission.title}`}>
                        <Trash2 size={16} />
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
        <nav aria-label="Pagination des missions" className="flex flex-col items-center justify-between gap-3 border-t border-line bg-slate-50/60 px-4 py-3 sm:flex-row sm:px-5">
          <p className="text-xs text-ink-muted">
            <span className="font-semibold tabular-nums text-ink">{startIndex + 1}–{Math.min(endIndex, totalMissions)}</span> sur{' '}
            <span className="font-semibold tabular-nums text-ink">{totalMissions}</span> missions
          </p>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage === 1} className="ui-btn-secondary ui-btn-sm" aria-label="Page précédente">
              <ChevronLeft size={14} aria-hidden="true" /> Précédent
            </button>
            <span className="px-2 text-xs font-semibold tabular-nums text-ink-soft">{safeCurrentPage} / {totalPages}</span>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage === totalPages} className="ui-btn-secondary ui-btn-sm" aria-label="Page suivante">
              Suivant <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}

      </>}
      {/* ═══ MODALE CRÉATION / MODIFICATION ═══ */}
      <Modal
        side
        dismissible={!isSaving}
        open={isModalOpen}
        onClose={handleCloseModal}
        size="xl"
        icon={ClipboardList}
        title={modalMode === 'create' ? 'Ajouter une mission' : 'Modifier la mission'}
        description={modalMode === 'create'
          ? 'Renseignez les détails pour assigner une nouvelle mission.'
          : 'Mettez à jour les informations de la mission existante.'}
        footer={
          <>
            <button type="button" onClick={handleCloseModal} className="ui-btn-secondary">Annuler</button>
            <button form="mission-form" type="submit" disabled={isSaving || panelLoading || !originalMission} className="ui-btn-primary disabled:opacity-50">
              <CheckCircle2 size={16} aria-hidden="true" />
              {modalMode === 'create' ? 'Créer la mission' : 'Enregistrer les modifications'}
            </button>
          </>
        }
      >
        {dataError && <InlineAlert tone="error">{dataError}</InlineAlert>}
        {panelLoading && <SkeletonLines count={6} />}
        <form id="mission-form" onSubmit={handleSubmitModal} noValidate className={panelLoading ? 'hidden' : 'flex flex-col gap-7'}>
          {formError && (
            <div id="mission-form-error" role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold">Enregistrement impossible</p>
                <p className="leading-relaxed">{formError}</p>
              </div>
            </div>
          )}
          <section>
            {sectionTitle(Wrench, 'Configuration')}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <fieldset>
                <legend className="ui-label">Type de mission</legend>
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-slate-50 p-1">
                  {[{ value: 'Normal', label: 'Mission normale', icon: ClipboardList }, { value: 'Intervention', label: 'Intervention SAV', icon: Wrench }].map((option) => {
                    const Icon = option.icon
                    const active = missionType === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => { setMissionType(option.value); setSelectedInterventionId('') }}
                        className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${active ? 'bg-white text-brand-700 shadow-sm ring-1 ring-line' : 'text-ink-muted hover:text-ink'}`}
                      >
                        <Icon size={14} aria-hidden="true" /> {option.label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
              {missionType === 'Intervention' && (
                <div>
                  <label htmlFor="mt-intervention" className="ui-label">Lier à une intervention <span className="text-red-500" aria-hidden="true">*</span></label>
                  <select id="mt-intervention" value={selectedInterventionId} onChange={(e) => setSelectedInterventionId(e.target.value)} className="ui-select" required>
                    <option value="">Sélectionner une intervention</option>
                    <optgroup label="En attente (non assignées)">
                      {linkableInterventions.filter(i => i.status === 'PENDING').map((inv) => (
                        <option key={inv.id} value={inv.id}>{inv.id} — {inv.client} — {inv.machine}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Affectées (déjà assignées)">
                      {linkableInterventions.filter(i => i.status === 'ASSIGNED').map((inv) => (
                        <option key={inv.id} value={inv.id}>{inv.id} — {inv.client} — {inv.machine} ({inv.assignedTo})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}
            </div>

            {missionType === 'Intervention' && selectedIntervention && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-brand-100 bg-brand-50/50">
                <div className="flex items-center justify-between gap-3 border-b border-brand-100 px-4 py-3">
                  <span className="flex items-center gap-2 text-xs font-bold text-brand-800">
                    <AlertCircle size={14} aria-hidden="true" /> Détails de l’intervention
                    <span className="ui-ref">{selectedIntervention.id}</span>
                  </span>
                  <span className={`ui-badge ring-transparent ${interventionStatusColors[selectedIntervention.status] || 'bg-slate-100 text-slate-600'}`}>
                    {selectedIntervention.status === 'PENDING' && <Hourglass size={10} aria-hidden="true" />}
                    {selectedIntervention.status === 'ASSIGNED' && <UserCheck size={10} aria-hidden="true" />}
                    {selectedIntervention.statusLabel}
                  </span>
                </div>
                <dl className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2">
                  <div><dt className="text-[11px] font-medium text-ink-muted">Client</dt><dd className="mt-0.5 text-sm font-semibold text-ink">{selectedIntervention.client}</dd><dd className="text-[11px] text-ink-faint">{selectedIntervention.clientCode}</dd></div>
                  <div><dt className="text-[11px] font-medium text-ink-muted">Équipement</dt><dd className="mt-0.5 text-sm font-semibold text-ink">{selectedIntervention.machine}</dd><dd className="text-[11px] text-ink-faint">{selectedIntervention.type}</dd></div>
                  <div><dt className="text-[11px] font-medium text-ink-muted">Téléphone</dt><dd className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-ink"><Phone size={13} className="text-brand-400" aria-hidden="true" />{selectedIntervention.phone}</dd></div>
                  <div><dt className="text-[11px] font-medium text-ink-muted">Date création</dt><dd className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-ink"><Calendar size={13} className="text-brand-400" aria-hidden="true" />{selectedIntervention.date}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-[11px] font-medium text-ink-muted">Demande / problème</dt><dd className="mt-1 rounded-xl bg-white px-3 py-2 text-sm leading-relaxed text-ink-soft ring-1 ring-inset ring-brand-100">{selectedIntervention.request}</dd></div>
                  {selectedIntervention.assignedTo && (
                    <div className="sm:col-span-2"><dt className="text-[11px] font-medium text-ink-muted">Déjà assignée à</dt>
                      <dd className="mt-1 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">{getAvatarFromName(selectedIntervention.assignedTo)}</span><span className="text-sm font-semibold text-ink">{selectedIntervention.assignedTo}</span></dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4">
            {sectionTitle(FileText, 'Détails de la mission')}
            <div>
              <label htmlFor="mt-title" className="ui-label">{missionType === 'Normal' ? 'Titre de la mission' : 'Titre de la sous-mission'} <span className="text-red-500" aria-hidden="true">*</span></label>
              <input id="mt-title" type="text" value={formTitle} onChange={(event) => setFormTitle(event.target.value)} className="ui-input" placeholder={missionType === 'Normal' ? 'Ex : Maintenance préventive…' : 'Ex : Vérification câblage…'} required />
            </div>
            <div>
              <label htmlFor="mt-desc" className="ui-label">{missionType === 'Normal' ? 'Description détaillée' : 'Description technique'} <span className="text-red-500" aria-hidden="true">*</span></label>
              <textarea id="mt-desc" rows={3} value={formDescription} onChange={(event) => setFormDescription(event.target.value)} className="ui-textarea resize-none" placeholder="Décrivez précisément les actions à réaliser…" required />
            </div>
            {missionType === 'Normal' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="mt-site" className="ui-label">Site</label>
                  <div className="relative">
                    <Building2 size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
                    <input id="mt-site" type="text" value={formSite} onChange={(e) => setFormSite(e.target.value)} className="ui-input pl-10" placeholder="Nom du site" />
                  </div>
                </div>
                <div>
                  <label htmlFor="mt-address" className="ui-label">Adresse</label>
                  <div className="relative">
                    <MapPin size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
                    <input id="mt-address" type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} className="ui-input pl-10" placeholder="Adresse complète" />
                  </div>
                </div>
              </div>
            )}
            <div>
              <label htmlFor="mt-notes" className="ui-label">Notes supplémentaires <span className="font-normal text-ink-faint">(optionnel)</span></label>
              <textarea id="mt-notes" rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="ui-textarea min-h-[72px] resize-none" placeholder="Consignes particulières, précautions, contacts sur place…" />
            </div>
          </section>

          <section>
            {sectionTitle(Users, 'Assignation & délai')}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="ui-label mb-0">{formEmployeeIds.length > 0 ? `Employés sélectionnés (${formEmployeeIds.length})` : 'Employé assigné (mode simple)'}</span>
                  {formEmployeeIds.length > 0 && (
                    <button type="button" onClick={() => setFormEmployeeIds([])} className="text-xs font-semibold text-red-600 hover:text-red-700">Annuler la sélection</button>
                  )}
                </div>
                {formEmployeeIds.length === 0 && (
                  <select aria-label="Employé assigné" value={formEmployee} onChange={(event) => setFormEmployee(event.target.value)} className="ui-select">
                    <option value="">Sélectionner un employé</option>
                    {employeeOptions.map((employee) => (
                      <option key={employee.id} value={employee.id}>{employee.name}</option>
                    ))}
                  </select>
                )}
                <fieldset className="overflow-hidden rounded-xl border border-line">
                  <legend className="sr-only">Sélection multiple d’employés</legend>
                  <p className="border-b border-line bg-slate-50 px-3 py-2 text-[11px] font-semibold text-ink-muted">Équipe de la mission · 3 techniciens maximum</p>
                  <div className="scrollbar-gray flex max-h-56 flex-col overflow-y-auto p-1.5">
                    {employeeOptions.length === 0 ? (
                      <p className="px-2 py-3 text-sm text-ink-muted">Aucun employé disponible</p>
                    ) : employeeOptions.map((employee) => {
                      const checked = formEmployeeIds.includes(employee.id)
                      return (
                        <label key={employee.id} className={`flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${checked ? 'bg-brand-50' : 'hover:bg-slate-50'}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!checked && formEmployeeIds.length >= 3}
                            onChange={(e) => {
                              if (e.target.checked) setFormEmployeeIds((prev) => prev.length < 3 ? [...prev, employee.id] : prev)
                              else setFormEmployeeIds((prev) => prev.filter((id) => id !== employee.id))
                            }}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                          />
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">{getAvatarFromName(employee.name)}</span>
                          <span className="flex-1 truncate text-sm font-medium text-ink-soft">{employee.name}</span>
                          {checked && <CheckCircle2 size={16} className="text-brand-600" aria-hidden="true" />}
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              </div>

              <div className="flex flex-col gap-4">
                {modalMode === 'edit' && (
                  <div>
                    <label htmlFor="mt-status" className="ui-label">Statut</label>
                    <select id="mt-status" value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="ui-select">
                      <option value="À faire">À faire</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminée">Terminée</option>
                      <option value="Bloquée">Bloquée</option>
                      <option value="Annulée">Annulée</option>
                    </select>
                  </div>
                )}
                <fieldset>
                  <legend className="ui-label">Priorité</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(PRIORITY_OPTIONS.some(p => p.value === formPriority) ? PRIORITY_OPTIONS : [...PRIORITY_OPTIONS, { value: formPriority, dot: 'bg-brand-600' }]).map((p) => {
                      const active = formPriority === p.value
                      return (
                        <button
                          key={p.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setFormPriority(p.value)}
                          className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all ${active ? 'border-brand-600 bg-brand-600 text-white shadow-sm' : 'border-line bg-white text-ink-soft hover:border-brand-200'}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${active ? 'bg-white' : p.dot}`} aria-hidden="true" />
                          {p.value}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="mt-date" className="ui-label">Date de mission</label>
                    <input id="mt-date" type="date" value={formDueDate} onChange={(event) => setFormDueDate(event.target.value)} className="ui-input" />
                  </div>
                  <div>
                    <label htmlFor="mt-time" className="ui-label">Heure de début</label>
                    <input id="mt-time" type="time" value={formDueTime} onChange={(event) => setFormDueTime(event.target.value)} className="ui-input" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            {sectionTitle(Truck, 'Véhicule & chauffeur')}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="min-w-0"><span className="ui-label">Véhicule affecté</span><select className="ui-select" value={formVehicleId} onChange={e => setFormVehicleId(e.target.value)}><option value="">Aucun véhicule</option>{vehicles.map(v => <option key={v.id} value={v.id} disabled={String(v.id) !== String(originalMission?.vehicleId) && (v.disponibilite === false || (v.statut && v.statut !== 'Disponible'))}>{[v.marque, v.modele, v.matricule].filter(Boolean).join(' · ')}{v.disponibilite === false ? ' — Affecté / indisponible' : ''}</option>)}</select></label>
              <label className="min-w-0"><span className="ui-label">Chauffeur</span><select className="ui-select" disabled={!formVehicleId} value={formEmployeeIds.length === 1 ? String(formEmployeeIds[0]) : formDriverId} onChange={e => setFormDriverId(e.target.value)}><option value="">Sélectionner un technicien</option>{employeeOptions.filter(e => formEmployeeIds.includes(e.id) || (!formEmployeeIds.length && String(e.id) === formEmployee)).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
            </div>
            <p className="mt-2 text-xs text-ink-muted">La disponibilité et les conflits sont vérifiés par le serveur lors de l’enregistrement.</p>
          </section>
          <section>
            {sectionTitle(Paperclip, 'Pièces jointes')}
            <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf" className="sr-only" id="mission-table-attachments" onChange={handlePickAttachments} />
            <label htmlFor="mission-table-attachments" className="group flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-line bg-slate-50/60 px-5 py-5 transition-colors hover:border-brand-300 hover:bg-brand-50/40">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-ink-faint shadow-card group-hover:text-brand-600">
                <UploadCloud size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink-soft group-hover:text-brand-700">Cliquez pour ajouter des fichiers</span>
                <span className="block text-xs text-ink-muted">PDF, JPG, PNG — 10 Mo max, 10 fichiers</span>
              </span>
            </label>

            {(modalMode === 'edit' && existingAttachments.length > 0) || newAttachments.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2">
                {modalMode === 'edit' && existingAttachments.map((a) => (
                  <li key={a.publicId} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <FileText size={16} className="shrink-0 text-brand-600" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-ink">{a.originalFilename || a.publicId}</span>
                        <span className="block text-[11px] text-ink-faint">Document existant</span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <a href={a.url} target="_blank" rel="noreferrer" className="ui-btn-ghost ui-btn-sm">Ouvrir</a>
                      <button type="button" onClick={() => removeExistingAttachment(a.publicId)} className="ui-btn-ghost ui-btn-sm text-red-600 hover:bg-red-50 hover:text-red-700">Retirer</button>
                    </span>
                  </li>
                ))}
                {newAttachments.map((file) => (
                  <li key={`${file.name}_${file.size}_${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <FileText size={16} className="shrink-0 text-brand-600" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-ink">{file.name}</span>
                        <span className="block text-[11px] text-ink-faint">Nouveau · {Math.ceil(file.size / 1024)} Ko</span>
                      </span>
                    </span>
                    <button type="button" onClick={() => removeNewAttachment(file)} className="ui-btn-ghost ui-btn-sm text-red-600 hover:bg-red-50 hover:text-red-700">Retirer</button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </form>
      </Modal>

      {/* ═══ MODALE CONSULTATION ═══ */}
      <Modal
        side
        open={isViewOpen && Boolean(viewMission)}
        onClose={handleCloseViewModal}
        size="lg"
        icon={viewMission?.type === 'Intervention' ? Wrench : ClipboardList}
        title={viewMission ? `Mission #${viewMission.id} · ${viewMission.title}` : 'Mission'}
        description={viewMission ? `${viewMission.type === 'Intervention' ? 'Intervention S.A.V' : 'Mission normale'} · Échéance ${viewMission.dueDate || 'Non renseigné'}${viewMission.dueTime ? ` à ${viewMission.dueTime}` : ''}` : undefined}
        footer={
          <>
            <button type="button" onClick={handleCloseViewModal} className="ui-btn-secondary">Fermer</button>
            {viewMission && <Link to={`/missions/${viewMission.id}`} className="ui-btn-secondary">Voir la mission</Link>}
            {viewMission && canEdit && !panelLoading && !panelError && (
              <button type="button" onClick={() => { const m = viewMission; handleCloseViewModal(); handleOpenEditModal(m) }} className="ui-btn-primary">
                <Edit size={15} aria-hidden="true" /> Modifier
              </button>
            )}
          </>
        }
      >
        {panelLoading && <SkeletonLines count={6} />}
        {panelError && <InlineAlert tone="error">{panelError}<button onClick={() => handleOpenViewModal(viewMission)} className="ml-2 underline">Réessayer</button></InlineAlert>}
        {viewMission && !panelLoading && !panelError && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={viewMission.priority}>Priorité {viewMission.priority}</StatusBadge>
              {getGroupedEmployeeStatuses(viewMission).length <= 1 && <StatusBadge status={viewMission.status} />}
              {viewMission.interventionId && <span className="ui-ref gap-1"><Link2 size={10} aria-hidden="true" />{viewMission.interventionId}</span>}
            </div>

            <section><h3 className="ui-eyebrow mb-2">Description</h3><p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-ink-soft ring-1 ring-inset ring-line">{viewMission.description || 'Non renseigné'}</p></section>

            <div className="overflow-hidden rounded-2xl border border-line">
              <p className="flex items-center gap-2 border-b border-line bg-slate-50/60 px-4 py-2.5 text-xs font-semibold text-ink-muted">
                <Users size={13} aria-hidden="true" /> Équipe et avancement
              </p>
              <ul className="divide-y divide-slate-100">
                {!getGroupedEmployeeStatuses(viewMission).length && <li className="px-4 py-3 text-sm text-ink-muted">Non renseigné</li>}
                {getGroupedEmployeeStatuses(viewMission).map((entry) => (
                  <li key={`${viewMission.id}_${entry.name}`} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">{getAvatarFromName(entry.name)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{entry.name}</span>
                        <span className="block break-words text-xs text-ink-muted">{entry.notes ? `Note : ${entry.notes}` : 'Aucune note technicien'}</span>
                      </span>
                    </span>
                    <StatusBadge status={entry.status} />
                  </li>
                ))}
              </ul>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['Référence', `#${viewMission.id}`],
                ['Client', viewMission.intervention?.client],
                ['Machine', viewMission.intervention?.machine],
                ['Chauffeur', viewMission.driverName || viewMission.team?.find(t => Number(t.userId) === Number(viewMission.driverUserId))?.name],
                ['Heure', viewMission.dueTime],
                ['Notes', viewMission.notes],
              ].map(([label, value]) => <div key={label} className="min-w-0 rounded-2xl border border-line px-4 py-3"><dt className="text-[11px] font-medium text-ink-muted">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-ink">{typeof value === 'string' && value.trim() ? value : 'Non renseigné'}</dd></div>)}
              <div className="flex items-start gap-3 rounded-2xl border border-line px-4 py-3">
                <Calendar size={16} className="mt-0.5 text-brand-600" aria-hidden="true" />
                <div><dt className="text-[11px] font-medium text-ink-muted">Échéance</dt><dd className="text-sm font-semibold tabular-nums text-ink">{viewMission.dueDate || 'Non renseigné'}{viewMission.dueTime ? ` · ${viewMission.dueTime}` : ''}</dd></div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-line px-4 py-3">
                <Truck size={16} className="mt-0.5 text-brand-600" aria-hidden="true" />
                <div className="min-w-0"><dt className="text-[11px] font-medium text-ink-muted">Véhicule affecté</dt><dd className="truncate text-sm font-semibold text-ink">{viewMission.vehicle ? [viewMission.vehicle.marque, viewMission.vehicle.modele, viewMission.vehicle.matricule].filter(Boolean).join(' · ') : 'Non renseigné'}</dd></div>
              </div>
              {(viewMission.site || viewMission.address) && (
                <div className="flex items-start gap-3 rounded-2xl border border-line px-4 py-3 sm:col-span-2">
                  <MapPin size={16} className="mt-0.5 text-brand-600" aria-hidden="true" />
                  <div className="min-w-0"><dt className="text-[11px] font-medium text-ink-muted">Site d’intervention</dt><dd className="break-words text-sm font-semibold text-ink">{[viewMission.site, viewMission.address].filter(Boolean).join(' — ')}</dd></div>
                </div>
              )}
            </dl>

            {Array.isArray(viewMission.attachments) && viewMission.attachments.length > 0 && (
              <div>
                <p className="ui-eyebrow mb-2">Documents ({viewMission.attachments.length})</p>
                <ul className="flex flex-col gap-2">
                  {viewMission.attachments.map((a) => (
                    <li key={a.publicId} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-2.5">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-inset ring-line">
                          {a.resourceType === 'image' ? <img src={a.url} alt={a.originalFilename || ''} className="h-full w-full object-cover" /> : <FileText size={17} className="text-ink-muted" aria-hidden="true" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink">{a.originalFilename || a.publicId}</span>
                          <span className="block text-[11px] text-ink-faint">{a.bytes ? `${Math.ceil(a.bytes / 1024)} Ko` : '—'} · {a.createdAt ? new Date(a.createdAt).toLocaleDateString('fr-FR') : '—'}</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <a href={a.url} target="_blank" rel="noreferrer" className="ui-icon-btn h-9 w-9" aria-label={`Ouvrir ${a.originalFilename || 'le document'}`}><Eye size={16} /></a>
                        <a href={a.url} target="_blank" rel="noreferrer" className="ui-icon-btn h-9 w-9" aria-label={`Télécharger ${a.originalFilename || 'le document'}`}><Download size={16} /></a>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

const MissionTable = forwardRef(MissionTableInner)

export default MissionTable
