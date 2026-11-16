import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import InterventionActions from './components/InterventionActions'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import {
  Search, Plus, Eye, Edit2, Trash2, Wrench,
  CheckCircle2, Hourglass,
  Building2, Calendar,
  PlayCircle, LayoutGrid, LayoutList, X, AlertTriangle,
  RefreshCw, UserCheck2,
  MoreHorizontal, Cpu,
  FileSearch, Truck, GraduationCap,
  ShieldAlert, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react'

// ─── Configuration ────────────────────────────────────────────────────────────
const statusConfig = {
  PENDING:     { label: "En attente d'affectation", short: 'En attente', badge: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500', icon: Hourglass,    bar: 'bg-amber-400' },
  ASSIGNED:    { label: 'Affectée technicien',      short: 'Affectée',   badge: 'bg-brand-50 text-brand-700 ring-brand-200', dot: 'bg-brand-600', icon: UserCheck2,   bar: 'bg-brand-500' },
  IN_PROGRESS: { label: 'En cours',                 short: 'En cours',   badge: 'bg-navy text-white ring-navy',               dot: 'bg-brand-300', icon: PlayCircle,   bar: 'bg-navy'      },
  CLOSED:      { label: 'Intervention clôturée',    short: 'Clôturée',   badge: 'bg-teal-50 text-teal-800 ring-teal-200',    dot: 'bg-teal-600',  icon: CheckCircle2, bar: 'bg-teal-500'  },
}

const typeConfig = {
  DEVIS:        { label: 'Devis',        icon: FileSearch    },
  LIVRAISON:    { label: 'Livraison',    icon: Truck         },
  FORMATION:    { label: 'Formation',    icon: GraduationCap },
  INSTALLATION: { label: 'Installation', icon: Plus          },
  REPARATION:   { label: 'Réparation',   icon: Wrench        },
  GARANTIE:     { label: 'Garantie',     icon: ShieldAlert   },
}

const fallbackStatus = statusConfig.PENDING
const fallbackType = typeConfig.REPARATION

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function parseDisplayDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return { day: String(date.getDate()).padStart(2, '0'), month: MONTHS_SHORT[date.getMonth()], year: date.getFullYear() }
}

function normalizeTypeKey(value) {
  const base = String(value || '').trim()
  if (!base) return ''
  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^0-9a-zA-Z]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

/**
 * Determines if an intervention item is already assigned to a technician.
 * Extracted to avoid duplicating this logic in mobile cards, desktop table, and ActionMenu.
 */
function isItemAssigned(item) {
  return Boolean(String(item?.assignee || '').trim())
    || Boolean(String(item?.assignedTo || '').trim())
    || Boolean(String(item?.technicianName || '').trim())
    || Boolean(item?.hasLinkedMission)
}

/**
 * Returns initials from a full name (e.g. "Jean Dupont" → "JD").
 */
function getInitials(name) {
  if (!name) return ''
  return name.split(' ').map(n => n[0]).join('')
}

/**
 * Computes display data for a single intervention item.
 * Used by both mobile card and desktop table row to avoid duplicating logic.
 */
function getItemDisplayData(item, highlightId) {
  const normalizedType = normalizeTypeKey(item.type)
  const st = statusConfig[item.status] || fallbackStatus
  const ty = typeConfig[normalizedType] || fallbackType
  const TyIcon = ty.icon || Wrench
  const isHighlighted = String(item.id) === String(highlightId)
  return { normalizedType, st, ty, TyIcon, isHighlighted }
}

/**
 * Tracks employee names by their assignment group ID.
 */
function buildNamesByGroup(missionsData) {
  const namesByGroup = new Map()
  for (const mission of missionsData) {
    const groupId = mission?.assignmentGroupId
    const employeeName = String(mission?.employee || '').trim()
    if (!groupId || !employeeName) continue
    if (!namesByGroup.has(groupId)) namesByGroup.set(groupId, new Set())
    namesByGroup.get(groupId).add(employeeName)
  }
  return namesByGroup
}

/**
 * Consolidates grouped employee names into the agents map.
 */
function consolidateGroupedNames(missionsData, namesByGroup, agentsByIntervention) {
  for (const [groupId, names] of namesByGroup.entries()) {
    for (const mission of missionsData) {
      if (mission?.assignmentGroupId !== groupId) continue
      if (!mission?.interventionId) continue
      const agents = agentsByIntervention.get(mission.interventionId)
      if (!agents) continue
      agents.clear()
      for (const name of names) agents.add(name)
    }
  }
}

/**
 * Builds a map of interventionId -> Set of assigned employee names,
 * and a map of interventionId -> linked mission count from mission data.
 */
function buildMissionMaps(missionsData) {
  const agentsByIntervention = new Map()
  const linkedMissionCounts = new Map()

  if (!Array.isArray(missionsData)) return { agentsByIntervention, linkedMissionCounts }

  for (const mission of missionsData) {
    const employeeName = String(mission?.employee || '').trim()
    const interventionId = mission?.interventionId

    if (interventionId) {
      linkedMissionCounts.set(interventionId, (linkedMissionCounts.get(interventionId) || 0) + 1)
    }

    if (!employeeName || !interventionId) continue

    if (!agentsByIntervention.has(interventionId)) {
      agentsByIntervention.set(interventionId, new Set())
    }
    agentsByIntervention.get(interventionId).add(employeeName)
  }

  const namesByGroup = buildNamesByGroup(missionsData)
  consolidateGroupedNames(missionsData, namesByGroup, agentsByIntervention)

  return { agentsByIntervention, linkedMissionCounts }
}

/**
 * Normalizes raw intervention API data into UI-ready format.
 */
function normalizeInterventions(interventionsData, agentsByIntervention, linkedMissionCounts) {
  if (!Array.isArray(interventionsData)) return []
  return interventionsData.map((i) => {
    const interventionId = i.id
    const assignees = agentsByIntervention.get(interventionId)
    const assigneeDisplay = assignees && assignees.size > 0
      ? Array.from(assignees).join(', ')
      : (i.assignee || i.assignedTo || i.technicianName || null)

    return {
      id: i.id,
      client: i.client || i.clientName || '',
      machine: i.machine || i.machineType || '',
      type: i.type || '',
      status: i.status || 'PENDING',
      date: i.date || i.interventionDate || '',
      assignee: assigneeDisplay,
      priority: i.priority || 'Moyenne',
      linkedMissionCount: linkedMissionCounts.get(interventionId) || 0,
      hasLinkedMission: (linkedMissionCounts.get(interventionId) || 0) > 0,
    }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status, compact = false }) {
  const st = statusConfig[status] || fallbackStatus
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${st.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} aria-hidden="true" />
      {compact ? st.short : st.label}
    </span>
  )
}

function DateBlock({ value }) {
  const parsed = parseDisplayDate(value)
  if (!parsed) {
    return <span className="text-xs font-medium text-ink-muted">{value || '—'}</span>
  }
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 ring-1 ring-inset ring-line">
        <span className="font-display text-sm font-bold leading-none text-ink tabular-nums">{parsed.day}</span>
        <span className="mt-0.5 text-[9px] font-semibold uppercase leading-none text-ink-faint">{parsed.month}</span>
      </div>
      <span className="text-xs font-medium text-ink-muted tabular-nums">{parsed.year}</span>
    </div>
  )
}

function TechnicianChip({ name, compact = false }) {
  if (!name) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
        <AlertTriangle size={12} aria-hidden="true" /> Non affecté
      </span>
    )
  }
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white ring-2 ring-white" aria-hidden="true">
        {getInitials(name).slice(0, 2).toUpperCase()}
      </span>
      <span className={`truncate text-sm font-medium text-ink ${compact ? 'max-w-[8rem]' : ''}`}>{name}</span>
    </div>
  )
}

function PipelineOverview({ total, kpiData, statusFilter, onSelect }) {
  return (
    <section className="ui-card overflow-hidden p-0" aria-labelledby="pipeline-title">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="ui-eyebrow">Pipeline SAV</p>
            <h2 id="pipeline-title" className="font-display text-lg font-bold text-ink">
              <span className="tabular-nums">{total}</span> dossier{total > 1 ? 's' : ''} suivi{total > 1 ? 's' : ''}
            </h2>
          </div>
          {statusFilter !== 'ALL' && (
            <button type="button" onClick={() => onSelect('ALL')} className="ui-btn-ghost ui-btn-sm">
              <X size={14} aria-hidden="true" /> Voir tous les statuts
            </button>
          )}
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Répartition des dossiers par statut">
          {kpiData.map((k) => (
            k.count > 0 && (
              <div
                key={k.key}
                className={`h-full transition-all duration-700 ${k.bar} ${statusFilter !== 'ALL' && statusFilter !== k.key ? 'opacity-25' : ''}`}
                style={{ width: `${(k.count / Math.max(total, 1)) * 100}%` }}
              />
            )
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-line lg:grid-cols-4">
        {kpiData.map((k, index) => {
          const active = statusFilter === k.key
          const pct = total > 0 ? Math.round((k.count / total) * 100) : 0
          const KIcon = k.icon
          return (
            <button
              key={k.key}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(active ? 'ALL' : k.key)}
              className={`group flex min-w-0 items-center gap-3 px-4 py-3.5 text-left transition-colors sm:px-5
                ${index % 2 === 1 ? 'border-l border-line' : ''} ${index >= 2 ? 'border-t border-line lg:border-t-0' : ''} ${index === 2 ? 'lg:border-l' : ''}
                ${active ? 'bg-brand-50/70' : 'hover:bg-slate-50'}`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-muted group-hover:text-brand-700'}`}>
                <KIcon size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-ink-muted">{k.short}</span>
                <span className="flex items-baseline gap-1.5">
                  <span className="font-display text-xl font-bold leading-tight text-ink tabular-nums">{k.count}</span>
                  <span className="text-[11px] font-medium text-ink-faint tabular-nums">{pct}%</span>
                </span>
              </span>
              <span className={`h-8 w-1 shrink-0 rounded-full ${k.bar}`} aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </section>
  )
}

function RowIconAction({ label, icon, onClick, tone = 'default', disabled = false }) {
  const Icon = icon
  const tones = {
    default: 'text-ink-muted hover:bg-brand-50 hover:text-brand-700',
    danger: 'text-ink-muted hover:bg-red-50 hover:text-red-600',
  }
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent ${tones[tone]}`}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  )
}

function ActionMenu({ item, onNavigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const isAlreadyAssigned = isItemAssigned(item)

  useEffect(() => {
    if (!open) return undefined
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const itemClass = 'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors'

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions pour ${item.id}`}
        className="ui-icon-btn h-8 w-8"
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-9 z-50 w-52 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-modal animate-scale-in">
          <button role="menuitem" onClick={() => { onNavigate('details', item); setOpen(false) }} className={`${itemClass} text-ink hover:bg-brand-50`}>
            <Eye size={15} aria-hidden="true" /> Consulter le dossier
          </button>
          <button role="menuitem" onClick={() => { onNavigate('edit', item); setOpen(false) }} className={`${itemClass} text-ink hover:bg-brand-50`}>
            <Edit2 size={15} aria-hidden="true" /> Modifier les infos
          </button>
          <button
            role="menuitem"
            disabled={isAlreadyAssigned}
            onClick={() => {
              if (isAlreadyAssigned) return
              onNavigate('assign', item)
              setOpen(false)
            }}
            className={`${itemClass} ${isAlreadyAssigned ? 'cursor-not-allowed text-slate-300' : 'text-ink hover:bg-brand-50'}`}
          >
            <UserCheck2 size={15} aria-hidden="true" /> Affecter technicien
          </button>
          <div className="my-1 border-t border-line" />
          <button role="menuitem" onClick={() => { onNavigate('delete', item); setOpen(false) }} className={`${itemClass} text-red-600 hover:bg-red-50`}>
            <Trash2 size={15} aria-hidden="true" /> Supprimer le dossier
          </button>
        </div>
      )}
    </div>
  )
}

function DeleteConfirmationModal({
  open,
  item,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}) {
  const linkedMissionCount = Number(item?.linkedMissionCount || 0)
  const hasLinkedMission = linkedMissionCount > 0

  return (
    <Modal
      open={open}
      onClose={onCancel}
      dismissible={!isDeleting}
      size="md"
      icon={hasLinkedMission ? AlertTriangle : Trash2}
      title={hasLinkedMission ? 'Supprimer cette intervention et sa mission ?' : 'Supprimer cette intervention ?'}
      description="Cette action est définitive."
      footer={
        <>
          <button type="button" onClick={onCancel} disabled={isDeleting} className="ui-btn-secondary">
            Annuler
          </button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="ui-btn-danger">
            {isDeleting ? <RefreshCw size={16} className="animate-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
            {isDeleting ? 'Suppression…' : 'Supprimer définitivement'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {item && (
          <div className="flex flex-col gap-1 rounded-2xl border border-line bg-slate-50/70 px-4 py-3">
            <span className="ui-ref w-fit">{item.id}</span>
            <p className="truncate text-sm font-semibold text-ink">{item.client}</p>
            <p className="truncate text-xs text-ink-muted">{item.machine}</p>
          </div>
        )}
        <div className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ring-1 ring-inset ${hasLinkedMission ? 'bg-amber-50 ring-amber-200' : 'bg-red-50/60 ring-red-100'}`}>
          {hasLinkedMission
            ? <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
            : <Trash2 size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />}
          <div className="min-w-0">
            <p className="text-sm font-medium leading-relaxed text-ink">
              {hasLinkedMission
                ? 'Cette intervention est affectée à une mission. La mission liée sera également supprimée.'
                : 'Êtes-vous sûr de vouloir supprimer cette intervention ?'}
            </p>
            {hasLinkedMission && (
              <p className="mt-1 text-xs font-medium text-amber-800">
                {linkedMissionCount > 1
                  ? `${linkedMissionCount} missions liées seront supprimées.`
                  : 'La mission liée sera supprimée en même temps.'}
              </p>
            )}
          </div>
        </div>
        {error && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}

function SuccessModal({ open, message, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      icon={CheckCircle2}
      title="Suppression effectuée"
      footer={<button type="button" onClick={onClose} className="ui-btn-primary" data-autofocus>Fermer</button>}
    >
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{message}</p>
    </Modal>
  )
}

function EmptyResults({ onReset }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-ink-faint ring-1 ring-inset ring-line">
        <Search size={24} aria-hidden="true" />
      </div>
      <div>
        <p className="font-display text-base font-bold text-ink">Aucune intervention trouvée</p>
        <p className="mt-1 text-sm text-ink-muted">Modifiez vos filtres ou lancez une nouvelle recherche.</p>
      </div>
      <button type="button" onClick={onReset} className="ui-btn-secondary ui-btn-sm mt-1">
        <RefreshCw size={14} aria-hidden="true" /> Effacer les filtres
      </button>
    </div>
  )
}

export default function InterventionList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('list')
  const [interventions, setInterventions] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '' })
  const toastTimerRef = useRef(null)
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    item: null,
    isDeleting: false,
    error: '',
  })
  const [deleteSuccess, setDeleteSuccess] = useState({ open: false, message: '' })
  const [highlightId, setHighlightId] = useState('')
  const highlightTimerRef = useRef(null)
  const highlightRowRef = useRef(null)
  
  // Date Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const resetFilters = () => {
    setStartDate('')
    setEndDate('')
    setSearch('')
    setTypeFilter('ALL')
    setStatusFilter('ALL')
  }

  useEffect(() => {
    const refreshOnFocus = () => fetchInterventions()
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchInterventions()
      }
    }

    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshOnVisible)

    return () => {
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshOnVisible)
    }
  }, [])

  const fetchInterventions = async () => {
    setLoading(true)
    try {
      const [interventionsRes, missionsRes] = await Promise.all([
        apiFetch('/interventions', { auth: true }),
        apiFetch('/missions', { auth: true }),
      ])

      if (!interventionsRes.ok || !missionsRes.ok) {
        setInterventions([])
        setLoading(false)
        return
      }

      const interventionsData = await interventionsRes.json()
      const missionsData = await missionsRes.json()

      const { agentsByIntervention, linkedMissionCounts } = buildMissionMaps(missionsData)
      const normalized = normalizeInterventions(interventionsData, agentsByIntervention, linkedMissionCounts)
      setInterventions(normalized)
    } catch (error) {
      console.error('Error fetching interventions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInterventions()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const highlight = params.get('highlight') || location.state?.createdInterventionId || ''
    const toastKey = params.get('toast') || ''
    if (!highlight && !toastKey) return

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = null
    }

    if (toastKey === 'created') {
      setToast({
        open: true,
        message:
          "Dossier d’intervention créé avec succès !\n" +
          "Statut : En attente\n" +
          "Employé assigné : Non assigné\n" +
          "Vous pouvez maintenant créer une mission pour affecter un employé à cette intervention.",
      })
      toastTimerRef.current = window.setTimeout(() => {
        setToast({ open: false, message: '' })
        toastTimerRef.current = null
      }, 3000)
    }

    if (highlight) {
      setViewMode('list')
      setHighlightId(String(highlight))
      window.setTimeout(() => {
        if (highlightRowRef.current?.scrollIntoView) {
          highlightRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 80)
      highlightTimerRef.current = window.setTimeout(() => {
        setHighlightId('')
        highlightTimerRef.current = null
      }, 1800)
    }

    if (location.search || location.state?.createdInterventionId) {
      navigate({ pathname: location.pathname, search: '' }, { replace: true, state: {} })
    }

    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = null
    }
  }, [location.pathname, location.search, location.state, navigate])

  const handleNavigate = (action, itemOrId) => {
    const item = typeof itemOrId === 'object' && itemOrId !== null ? itemOrId : null
    const id = item ? item.id : itemOrId

    if (action === 'details') {
      navigate(`/interventions/${id}`, {
        state: { assignedTechnicianName: item?.assignee || null, readOnly: true }
      })
      return
    }

    if (action === 'edit') {
      navigate(`/interventions/${id}`, {
        state: {
          assignedTechnicianName: item?.assignee || null,
          returnTo: `${location.pathname}${location.search}`,
        },
      })
    }
    else if (action === 'assign') navigate('/missions/assign', { state: { prefillInterventionId: id } })
    else if (action === 'delete') {
      setDeleteDialog({
        open: true,
        item: item || null,
        isDeleting: false,
        error: '',
      })
    }
  }

  const handleDeleteCancel = () => {
    if (deleteDialog.isDeleting) return
    setDeleteDialog({ open: false, item: null, isDeleting: false, error: '' })
  }

  const handleDeleteConfirm = async () => {
    const target = deleteDialog.item
    if (!target || deleteDialog.isDeleting) return

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true, error: '' }))

    try {
      const response = await apiFetch(`/interventions/${target.id}`, {
        method: 'DELETE',
        auth: true,
      })

      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.error || 'Impossible de supprimer cette intervention.',
        )
      }

      const missionsDeletedCount = Number(
        payload?.missionsDeletedCount ?? (payload?.missionDeleted ? 1 : 0),
      ) || 0

      let successMessage = "L'intervention a \u00e9t\u00e9 supprim\u00e9e avec succ\u00e8s."
      if (missionsDeletedCount > 1) {
        successMessage = `L'intervention et les ${missionsDeletedCount} missions li\u00e9es ont \u00e9t\u00e9 supprim\u00e9es avec succ\u00e8s.`
      } else if (missionsDeletedCount === 1) {
        successMessage = "L'intervention et la mission li\u00e9e ont \u00e9t\u00e9 supprim\u00e9es avec succ\u00e8s."
      }

      await fetchInterventions()
      setDeleteDialog({ open: false, item: null, isDeleting: false, error: '' })
      setDeleteSuccess({ open: true, message: successMessage })
    } catch (error) {
      setDeleteDialog((prev) => ({
        ...prev,
        isDeleting: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression.',
      }))
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, typeFilter, startDate, endDate])

  const filtered = useMemo(() => {
    return interventions.filter(i => {
      const matchSearch = [i.id, i.client, i.machine].some(v => v.toLowerCase().includes(search.toLowerCase()))
      const matchStatus = statusFilter === 'ALL' || i.status === statusFilter
      const matchType   = typeFilter   === 'ALL' || i.type   === typeFilter
      
      // Date filtering logic
      let matchDate = true
      if (startDate || endDate) {
        const itemDate = new Date(i.date)
        if (startDate) {
          const start = new Date(startDate)
          if (itemDate < start) matchDate = false
        }
        if (endDate) {
          const end = new Date(endDate)
          if (itemDate > end) matchDate = false
        }
      }

      return matchSearch && matchStatus && matchType && matchDate
    })
  }, [interventions, search, statusFilter, typeFilter, startDate, endDate])

  useEffect(() => {
    if (!highlightId) return
    const idx = filtered.findIndex((i) => String(i.id) === String(highlightId))
    if (idx < 0) return
    const page = Math.floor(idx / itemsPerPage) + 1
    if (page !== currentPage) setCurrentPage(page)
  }, [filtered, highlightId, itemsPerPage, currentPage])

  const total = interventions.length
  const kpiData = Object.entries(statusConfig).map(([key, cfg]) => ({
    key, ...cfg, count: interventions.filter(i => i.status === key).length
  }))

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filtered.slice(startIndex, startIndex + itemsPerPage)
  }, [filtered, currentPage])

  const hasActiveFilters = Boolean(startDate || endDate || search || typeFilter !== 'ALL' || statusFilter !== 'ALL')
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filtered.length)

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <DeleteConfirmationModal
        open={deleteDialog.open}
        item={deleteDialog.item}
        isDeleting={deleteDialog.isDeleting}
        error={deleteDialog.error}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
      <SuccessModal
        open={deleteSuccess.open}
        message={deleteSuccess.message}
        onClose={() => setDeleteSuccess({ open: false, message: '' })}
      />
      {toast.open && (
        <div className="fixed left-4 right-4 top-4 z-[130] animate-fade-in sm:left-auto sm:right-6 sm:top-6">
          <div role="status" className="w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-white shadow-modal sm:w-[380px]">
            <div className="flex items-start gap-3 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200">
                <CheckCircle2 size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="ui-eyebrow">Interventions</p>
                <p className="mt-0.5 whitespace-pre-line break-words text-sm font-medium leading-snug text-ink">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (toastTimerRef.current) {
                    window.clearTimeout(toastTimerRef.current)
                    toastTimerRef.current = null
                  }
                  setToast({ open: false, message: '' })
                }}
                className="ui-icon-btn h-8 w-8"
                aria-label="Fermer la notification"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ui-page pb-0 pt-5 sm:pt-7">
        <PageHeader
          eyebrow="Service après-vente"
          title="Interventions"
          description="Suivi des demandes, des affectations techniciens et des clôtures."
          icon={Wrench}
          actions={
            <>
              <button type="button" onClick={fetchInterventions} className="ui-btn-secondary hidden sm:inline-flex" disabled={loading}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Actualiser
              </button>
              <button type="button" onClick={() => navigate('/interventions/create')} className="ui-btn-primary">
                <Plus size={18} strokeWidth={2.25} aria-hidden="true" /> Nouvelle intervention
              </button>
            </>
          }
        />
      </div>

      <main className="ui-page flex flex-1 flex-col gap-5 pt-5 sm:gap-6 sm:pt-6">
        <PipelineOverview total={total} kpiData={kpiData} statusFilter={statusFilter} onSelect={setStatusFilter} />

        {/* Filter rail */}
        <section className="ui-card flex flex-col gap-4 p-4 sm:p-5" aria-label="Filtres">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="intervention-search" className="sr-only">Rechercher une intervention</label>
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
              <input
                id="intervention-search"
                type="search"
                placeholder="Référence, client ou machine…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="ui-input w-full pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3 ring-1 ring-inset ring-line sm:flex-none">
                <Calendar size={14} className="shrink-0 text-brand-600" aria-hidden="true" />
                <label htmlFor="date-start" className="sr-only">Date de début</label>
                <input id="date-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none sm:w-[8.5rem] sm:flex-none" />
                <span className="text-xs text-ink-faint" aria-hidden="true">→</span>
                <label htmlFor="date-end" className="sr-only">Date de fin</label>
                <input id="date-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none sm:w-[8.5rem] sm:flex-none" />
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Mode d'affichage">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white text-brand-700 shadow-card' : 'text-ink-muted hover:text-ink'}`}
                >
                  <LayoutList size={15} aria-hidden="true" /> Liste
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  aria-pressed={viewMode === 'kanban'}
                  className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all ${viewMode === 'kanban' ? 'bg-white text-brand-700 shadow-card' : 'text-ink-muted hover:text-ink'}`}
                >
                  <LayoutGrid size={15} aria-hidden="true" /> Tableau
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="-mx-1 flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-1 pb-0.5 no-scrollbar" role="group" aria-label="Type d'intervention">
              {[['ALL', { label: 'Tous les types', icon: Wrench }], ...Object.entries(typeConfig)].map(([key, cfg]) => {
                const active = typeFilter === key
                const TIcon = cfg.icon
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTypeFilter(key)}
                    className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 ring-inset transition-colors ${active ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink-muted ring-line hover:text-brand-700 hover:ring-brand-200'}`}
                  >
                    <TIcon size={13} aria-hidden="true" /> {cfg.label}
                  </button>
                )
              })}
            </div>
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="ui-btn-ghost ui-btn-sm shrink-0 text-red-600 hover:bg-red-50">
                <X size={14} aria-hidden="true" /> <span className="hidden sm:inline">Réinitialiser</span>
              </button>
            )}
          </div>
        </section>

        {viewMode === 'list' && (
          <section className="ui-card overflow-hidden p-0" aria-label="Liste des interventions">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
              <p className="text-sm text-ink-muted">
                <span className="font-semibold text-ink tabular-nums">{filtered.length}</span> résultat{filtered.length > 1 ? 's' : ''}
                {statusFilter !== 'ALL' && <> · <span className="font-medium text-ink">{(statusConfig[statusFilter] || fallbackStatus).short}</span></>}
              </p>
              {loading && <RefreshCw size={14} className="animate-spin text-brand-600" aria-label="Chargement" />}
            </div>

            {/* Mobile & tablet: ticket cards */}
            <div className="grid grid-cols-1 gap-3 bg-slate-50/50 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
              {paginatedData.map((item) => {
                const { st, ty, TyIcon, isHighlighted } = getItemDisplayData(item, highlightId)
                const isAssigned = isItemAssigned(item)
                return (
                  <article
                    key={item.id}
                    ref={isHighlighted ? highlightRowRef : null}
                    className={`relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card ${isHighlighted ? 'ring-2 ring-teal-300' : ''}`}
                  >
                    <div className={`h-1 w-full ${st.bar}`} aria-hidden="true" />
                    <div className="flex flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="ui-ref">{item.id}</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700">
                            <TyIcon size={12} aria-hidden="true" /> {ty.label}
                          </span>
                        </div>
                        <StatusPill status={item.status} compact />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-base font-bold text-ink">{item.client || '—'}</h3>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-ink-muted">
                          <Cpu size={13} className="shrink-0 text-ink-faint" aria-hidden="true" />
                          <span className="truncate">{item.machine || '—'}</span>
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-dashed border-line pt-3">
                        <TechnicianChip name={item.assignee} compact />
                        <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink-muted tabular-nums">
                          <Calendar size={13} className="text-brand-600" aria-hidden="true" /> {item.date || '—'}
                        </span>
                      </div>
                      <span className="sr-only">Statut : {st.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-line bg-slate-50/60 p-3">
                      <InterventionActions variant="card" item={item} isAssigned={isAssigned} onNavigate={handleNavigate} />
                    </div>
                  </article>
                )
              })}
              {paginatedData.length === 0 && (
                <div className="rounded-2xl border border-line bg-white sm:col-span-2">
                  <EmptyResults onReset={resetFilters} />
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[920px] text-left">
                <thead>
                  <tr className="border-b border-line bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                    <th scope="col" className="py-3 pl-6 pr-4">Dossier</th>
                    <th scope="col" className="px-4 py-3">Client &amp; machine</th>
                    <th scope="col" className="px-4 py-3">Technicien</th>
                    <th scope="col" className="px-4 py-3">Date</th>
                    <th scope="col" className="px-4 py-3">Statut</th>
                    <th scope="col" className="py-3 pl-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {paginatedData.map((item) => {
                    const { st, ty, TyIcon, isHighlighted } = getItemDisplayData(item, highlightId)
                    const isAssigned = isItemAssigned(item)
                    return (
                      <tr
                        key={item.id}
                        ref={isHighlighted ? highlightRowRef : null}
                        onClick={() => handleNavigate('details', item)}
                        className={`group cursor-pointer transition-colors ${isHighlighted ? 'bg-teal-50' : 'hover:bg-brand-50/40'}`}
                      >
                        <td className="relative py-3.5 pl-6 pr-4">
                          <span className={`absolute bottom-3 left-0 top-3 w-1 rounded-r-full ${st.bar}`} aria-hidden="true" />
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
                              <TyIcon size={17} aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <span className="ui-ref">{item.id}</span>
                              <p className="mt-1 text-xs font-medium text-ink-muted">{ty.label}</p>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[18rem] px-4 py-3.5">
                          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink group-hover:text-brand-700">
                            <Building2 size={14} className="shrink-0 text-ink-faint" aria-hidden="true" />
                            <span className="truncate">{item.client || '—'}</span>
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-muted">
                            <Cpu size={13} className="shrink-0 text-ink-faint" aria-hidden="true" />
                            <span className="truncate">{item.machine || '—'}</span>
                          </p>
                        </td>
                        <td className="px-4 py-3.5"><TechnicianChip name={item.assignee} /></td>
                        <td className="px-4 py-3.5"><DateBlock value={item.date} /></td>
                        <td className="px-4 py-3.5"><StatusPill status={item.status} /></td>
                        <td className="py-3.5 pl-4 pr-6">
                          <div className="flex items-center justify-end gap-0.5">
                            <RowIconAction label="Consulter le dossier" icon={Eye} onClick={() => handleNavigate('details', item)} />
                            <RowIconAction label="Modifier" icon={Edit2} onClick={() => handleNavigate('edit', item)} />
                            <RowIconAction label={isAssigned ? 'Déjà affectée' : 'Affecter un technicien'} icon={UserCheck2} disabled={isAssigned} onClick={() => handleNavigate('assign', item)} />
                            <RowIconAction label="Supprimer" icon={Trash2} tone="danger" onClick={() => handleNavigate('delete', item)} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {paginatedData.length === 0 && (
                    <tr><td colSpan="6"><EmptyResults onReset={resetFilters} /></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <nav className="flex flex-col gap-3 border-t border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5" aria-label="Pagination">
                <p className="text-sm text-ink-muted">
                  <span className="font-semibold text-ink tabular-nums">{rangeStart}–{rangeEnd}</span> sur <span className="tabular-nums">{filtered.length}</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="ui-icon-btn h-9 w-9 disabled:opacity-30" aria-label="Page précédente">
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-1 text-ink-faint" aria-hidden="true">…</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          aria-current={p === currentPage ? 'page' : undefined}
                          className={`h-9 min-w-9 rounded-xl px-3 text-sm font-semibold tabular-nums transition-colors ${p === currentPage ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-slate-100'}`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                  <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="ui-icon-btn h-9 w-9 disabled:opacity-30" aria-label="Page suivante">
                    <ChevronRightIcon size={16} aria-hidden="true" />
                  </button>
                </div>
              </nav>
            )}
          </section>
        )}

        {viewMode === 'kanban' && (
          <section className="-mx-4 flex min-h-[420px] snap-x gap-4 overflow-x-auto px-4 pb-6 no-scrollbar sm:mx-0 sm:px-0" aria-label="Tableau par statut">
            {Object.entries(statusConfig).map(([statusKey, st]) => {
              const items = filtered.filter(i => i.status === statusKey)
              return (
                <div key={statusKey} className="flex w-[17.5rem] shrink-0 snap-start flex-col rounded-2xl bg-slate-100/70 p-2 sm:w-80">
                  <div className="flex items-center justify-between px-2 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${st.bar}`} aria-hidden="true" />
                      <h3 className="text-sm font-semibold text-ink">{st.short}</h3>
                    </div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink-muted tabular-nums ring-1 ring-inset ring-line">{items.length}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    {items.map(item => {
                      const ty = typeConfig[normalizeTypeKey(item.type)] || fallbackType
                      return (
                        <article
                          key={item.id}
                          onClick={() => handleNavigate('details', item)}
                          className="group cursor-pointer rounded-xl border border-line bg-white p-3.5 shadow-card transition-all hover:border-brand-200 hover:shadow-raised"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="ui-ref">{item.id}</span>
                            <span className="text-[11px] font-semibold text-brand-700">{ty.label}</span>
                          </div>
                          <h4 className="truncate text-sm font-semibold text-ink group-hover:text-brand-700">{item.client || '—'}</h4>
                          <p className="mt-0.5 truncate text-xs text-ink-muted">{item.machine || '—'}</p>
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                            {item.assignee ? (
                              <div className="flex min-w-0 items-center gap-1.5">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white" aria-hidden="true">
                                  {getInitials(item.assignee).slice(0, 2).toUpperCase()}
                                </span>
                                <span className="truncate text-xs font-medium text-ink">{item.assignee.split(' ')[0]}</span>
                              </div>
                            ) : (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">À affecter</span>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-ink-faint tabular-nums">{item.date}</span>
                              <ActionMenu item={item} onNavigate={handleNavigate} />
                            </div>
                          </div>
                        </article>
                      )
                    })}
                    {items.length === 0 && (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs font-medium text-ink-faint">
                        Aucun dossier
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </section>
        )}
      </main>
    </div>
  )
}
