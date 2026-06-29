import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import {
  Search, Plus, MoreVertical, Eye, Edit2, Trash2, Wrench,
  CheckCircle2, FileText, ChevronRight, UserPlus, Hourglass,
  UserCheck, Building2, Calendar, Settings,
  PlayCircle, LayoutGrid, LayoutList, X, TrendingUp, AlertTriangle,
  SlidersHorizontal, RefreshCw, UserCheck2, Filter, ChevronDown,
  ArrowUpRight, Clock, MapPin, MoreHorizontal, Printer,
  Share2, ShieldCheck, Zap, FileSearch, Truck, GraduationCap,
  ShieldAlert, ClipboardCheck, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react'

// ─── Configuration ────────────────────────────────────────────────────────────
const statusConfig = {
  PENDING:     { label: "En attente d'affectation", color: 'bg-amber-50 text-amber-700 border-amber-100',    dot: 'bg-amber-500',  icon: Hourglass,    bar: 'bg-amber-400'  },
  ASSIGNED:    { label: 'Affectée technicien',    color: 'bg-blue-50 text-blue-700 border-blue-100',       dot: 'bg-blue-500',   icon: UserCheck2,   bar: 'bg-blue-500'   },
  IN_PROGRESS: { label: 'En cours',                color: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500', icon: PlayCircle,   bar: 'bg-orange-500' },
  CLOSED:      { label: 'Intervention Clôturée',   color: 'bg-green-50 text-green-700 border-green-100',   dot: 'bg-green-500',  icon: CheckCircle2, bar: 'bg-green-500'  },
}

const typeConfig = {
  DEVIS:        { label: 'Devis',        color: 'bg-[#004a77]/5 text-[#004a77] border-[#004a77]/10', icon: FileSearch     },
  LIVRAISON:    { label: 'Livraison',    color: 'bg-[#004a77]/5 text-[#004a77] border-[#004a77]/10', icon: Truck          },
  FORMATION:    { label: 'Formation',    color: 'bg-[#004a77]/5 text-[#004a77] border-[#004a77]/10', icon: GraduationCap },
  INSTALLATION: { label: 'Installation',  color: 'bg-[#004a77]/5 text-[#004a77] border-[#004a77]/10', icon: Plus           },
  REPARATION:   { label: 'Réparation',    color: 'bg-[#004a77]/5 text-[#004a77] border-[#004a77]/10', icon: Wrench         },
  GARANTIE:     { label: 'Garantie',     color: 'bg-[#004a77]/5 text-[#004a77] border-[#004a77]/10', icon: ShieldAlert    },
}

const fallbackStatus = statusConfig.PENDING
const fallbackType = typeConfig.REPARATION

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

// ─── Mock data ────────────────────────────────────────────────────────────────
const _mockInterventions = [
  { id: 'INT-001', client: 'Total Energies',    machine: 'Compresseur C-12',  type: 'REPARATION',   status: 'PENDING',     date: '2025-05-01', assignee: null, priority: 'Haute' },
  { id: 'INT-002', client: 'Sonatrach',         machine: 'Turbine T-04',      type: 'GARANTIE',     status: 'ASSIGNED',    date: '2025-05-02', assignee: 'Ali Boumediene', priority: 'Critique' },
  { id: 'INT-003', client: 'Air Liquide',       machine: 'Pompe P-07',        type: 'INSTALLATION', status: 'IN_PROGRESS', date: '2025-05-03', assignee: 'Sara Meziane', priority: 'Moyenne' },
  { id: 'INT-004', client: 'Cevital',           machine: 'Moteur M-21',       type: 'FORMATION',    status: 'PENDING',     date: '2025-04-28', assignee: 'Karim Hadj', priority: 'Haute' },
  { id: 'INT-005', client: 'Naftal',            machine: 'Générateur G-03',  type: 'LIVRAISON',    status: 'CLOSED',      date: '2025-04-25', assignee: 'Sara Meziane', priority: 'Basse' },
  { id: 'INT-006', client: 'Total Energies',    machine: 'Vanne V-09',        type: 'DEVIS',        status: 'IN_PROGRESS', date: '2025-05-04', assignee: 'Yacine Ferhat', priority: 'Haute' },
  { id: 'INT-007', client: 'Sonelgaz',          machine: 'Transform. TR-02',  type: 'REPARATION',   status: 'PENDING',     date: '2025-05-05', assignee: null, priority: 'Moyenne' },
  { id: 'INT-008', client: 'Hamamet Resort',    machine: 'Climatiseur CL-15', type: 'REPARATION',   status: 'ASSIGNED',    date: '2025-05-06', assignee: 'Ali Boumediene', priority: 'Basse' },
  { id: 'INT-009', client: 'Cevital',           machine: 'Convoyeur CV-01',   type: 'DEVIS',        status: 'CLOSED',      date: '2025-04-22', assignee: 'Karim Hadj', priority: 'Moyenne' },
  { id: 'INT-010', client: 'Sonatrach',         machine: 'Robinet RB-11',     type: 'INSTALLATION', status: 'IN_PROGRESS', date: '2025-04-30', assignee: 'Yacine Ferhat', priority: 'Haute' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, count, total, icon, active, onClick, colorClass }) {
  const StatIcon = icon
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <button
      onClick={onClick}
      className={`w-full min-w-0 bg-white border-2 rounded-2xl p-3 sm:p-5 text-left transition-all relative overflow-hidden group
        ${active ? 'border-[#0052CC] shadow-xl shadow-blue-100/50 translate-y-[-4px]' : 'border-slate-100 hover:border-slate-300 hover:shadow-lg hover:translate-y-[-2px]'}`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.05] transition-transform group-hover:scale-110 ${colorClass}`} />
      <div className="flex items-center justify-between mb-2 sm:mb-4 relative z-10">
        <div className={`p-2 sm:p-2.5 rounded-xl shadow-sm ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600 transition-colors'}`}>
          <StatIcon size={18} className="sm:w-5 sm:h-5" />
        </div>
        <div className="flex flex-col items-end min-w-0">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-slate-400 truncate">{label}</span>
          <span className={`text-xl sm:text-2xl font-black leading-none mt-1 transition-colors ${active ? 'text-blue-600' : 'text-slate-900'}`}>{count}</span>
        </div>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-tight">{pct}%</span>
          <span className={`text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-md ${active ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>{count}/{total}</span>
        </div>
        <div className="w-full h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${colorClass}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </button>
  )
}

function ActionMenu({ item, onNavigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const isAlreadyAssigned = Boolean(String(item?.assignee || '').trim()) || Boolean(String(item?.assignedTo || '').trim()) || Boolean(String(item?.technicianName || '').trim()) || Boolean(item?.hasLinkedMission)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-48 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions dossier</p>
          </div>
          <button onClick={() => { onNavigate('details', item); setOpen(false) }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#0052CC] transition-colors">
            <Eye size={14} /> Consulter le dossier
          </button>
          <button onClick={() => { onNavigate('edit', item); setOpen(false) }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#0052CC] transition-colors">
            <Edit2 size={14} /> Modifier les infos
          </button>
          <button
            disabled={isAlreadyAssigned}
            onClick={() => {
              if (isAlreadyAssigned) return
              onNavigate('assign', item)
              setOpen(false)
            }}
            className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold transition-colors ${
              isAlreadyAssigned
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-700 hover:bg-blue-50 hover:text-[#0052CC]'
            }`}
          >
            <UserCheck2 size={14} /> Affecter technicien
          </button>
          <div className="border-t border-slate-50" />
          <button onClick={() => { onNavigate('delete', item); setOpen(false) }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={14} /> Supprimer dossier
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
  if (!open) return null

  const linkedMissionCount = Number(item?.linkedMissionCount || 0)
  const hasLinkedMission = linkedMissionCount > 0

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Confirmer la suppression"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Suppression</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">
              {hasLinkedMission ? 'Supprimer cette intervention et sa mission ?' : 'Supprimer cette intervention ?'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Cette action est définitive.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {item && (
            <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-slate-700">
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">
                  {item.id}
                </span>
                <span className="truncate">{item.client}</span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
                <span className="truncate text-slate-500">{item.machine}</span>
              </div>
            </div>
          )}

          <div
            className={`rounded-2xl border px-4 py-4 ${hasLinkedMission ? 'border-amber-200 bg-amber-50/80' : 'border-slate-200 bg-slate-50'}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${hasLinkedMission ? 'bg-amber-100 text-amber-700' : 'bg-red-50 text-red-600'}`}
              >
                {hasLinkedMission ? <AlertTriangle size={18} /> : <Trash2 size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-700 whitespace-pre-line">
                  {hasLinkedMission
                    ? 'Cette intervention est affectée à une mission. La mission liée sera également supprimée.'
                    : 'Êtes-vous sûr de vouloir supprimer cette intervention ?'}
                </p>
                {hasLinkedMission && (
                  <p className="mt-2 text-xs font-medium text-amber-700/90">
                    {linkedMissionCount > 1
                      ? `${linkedMissionCount} missions liées seront supprimées.`
                      : 'La mission liée sera supprimée en même temps.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-75 ${hasLinkedMission ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isDeleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SuccessModal({ open, message, onClose }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/45 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Suppression réussie"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl">
        <div className="flex items-start gap-4 px-6 py-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Succès</p>
            <p className="mt-1 text-base font-semibold text-slate-800 whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>
        <div className="border-t border-emerald-100 bg-emerald-50/50 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-emerald-700"
          >
            Fermer
          </button>
        </div>
      </div>
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
      // Fetch interventions and missions in parallel
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

      // Build a map of interventionId -> grouped employee names
      const agentsByIntervention = new Map()
      const linkedMissionCounts = new Map()
      if (Array.isArray(missionsData)) {
        const namesByGroup = new Map()

        // First pass: group names by assignmentGroupId
        for (const mission of missionsData) {
          const groupId = mission?.assignmentGroupId
          const employeeName = String(mission?.employee || '').trim()
          const interventionId = mission?.interventionId

          if (interventionId) {
            linkedMissionCounts.set(
              interventionId,
              (linkedMissionCounts.get(interventionId) || 0) + 1,
            )
          }

          if (!employeeName) continue

          // Track by intervention for direct lookup
          if (interventionId) {
            if (!agentsByIntervention.has(interventionId)) {
              agentsByIntervention.set(interventionId, new Set())
            }
            agentsByIntervention.get(interventionId).add(employeeName)
          }

          // Also track grouped names for multi-assignment display
          if (groupId) {
            if (!namesByGroup.has(groupId)) {
              namesByGroup.set(groupId, new Set())
            }
            namesByGroup.get(groupId).add(employeeName)
          }
        }

        // Second pass: consolidate grouped names within interventions
        for (const [groupId, names] of namesByGroup.entries()) {
          for (const mission of missionsData) {
            if (mission?.assignmentGroupId === groupId && mission?.interventionId) {
              const interventionId = mission.interventionId
              if (agentsByIntervention.has(interventionId)) {
                // Replace with all grouped names for this group
                const agents = agentsByIntervention.get(interventionId)
                agents.clear()
                for (const name of names) {
                  agents.add(name)
                }
              }
            }
          }
        }
      }

      // Normalize interventions with grouped technician names
      const normalized = Array.isArray(interventionsData)
        ? interventionsData.map((i) => {
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
        : []
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
      const successMessage =
        missionsDeletedCount > 1
          ? `L’intervention et les ${missionsDeletedCount} missions liées ont été supprimées avec succès.`
          : missionsDeletedCount === 1
            ? 'L’intervention et la mission liée ont été supprimées avec succès.'
            : 'L’intervention a été supprimée avec succès.'

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
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
        <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-auto sm:right-6 z-[120] animate-in fade-in duration-200">
          <div
            role="status"
            className="w-full sm:w-[380px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex items-start gap-3.5 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interventions</p>
                <p className="text-sm font-semibold text-slate-800 whitespace-pre-line leading-snug mt-0.5 break-words">
                  {toast.message}
                </p>
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
                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
                aria-label="Fermer"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400" />
          </div>
        </div>
      )}
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-0 sm:h-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
              <Wrench size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">Liste des Interventions</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{total} dossiers</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestion SAV</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
            <button
              onClick={fetchInterventions}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
            <button
              onClick={() => navigate('/interventions/create')}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-3 bg-[#0052CC] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-[#0042a3] transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={3} /> Nouvelle Intervention
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <StatCard
            label="Tout"
            count={total}
            total={total}
            icon={LayoutGrid}
            colorClass="bg-slate-400"
            active={statusFilter === 'ALL'}
            onClick={() => setStatusFilter('ALL')}
          />
          {kpiData.map(k => (
            <StatCard
              key={k.key}
              label={k.label}
              count={k.count}
              total={total}
              icon={k.icon}
              colorClass={k.bar}
              active={statusFilter === k.key}
              onClick={() => setStatusFilter(prev => prev === k.key ? 'ALL' : k.key)}
            />
          ))}
        </div>

        {/* Filters & Actions Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative w-full lg:flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Rechercher par ID, client ou machine..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            {/* Type filter with icons */}
            <div className="relative group w-full sm:w-auto sm:min-w-[180px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                {typeFilter !== 'ALL' ? (
                  React.createElement(typeConfig[typeFilter].icon, { size: 14 })
                ) : (
                  <Filter size={14} />
                )}
              </div>
              <select 
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-pointer hover:bg-white hover:border-blue-200 transition-all appearance-none"
              >
                <option value="ALL">Tous les types</option>
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Date Filters Row */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-2 w-full sm:w-auto">
              <div className="flex flex-col gap-1 w-full sm:w-auto min-w-0">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date début</label>
                <div className="relative w-full sm:w-40 min-w-0">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" size={12} />
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all w-full min-w-0"
                  />
                  {!startDate && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none sm:hidden">JJ/MM/AAAA</span>
                  )}
                </div>
              </div>
              <span className="text-slate-300 text-xs hidden sm:inline pb-2.5">à</span>
              <div className="flex flex-col gap-1 w-full sm:w-auto min-w-0">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date fin</label>
                <div className="relative w-full sm:w-40 min-w-0">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" size={12} />
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all w-full min-w-0"
                  />
                  {!endDate && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none sm:hidden">JJ/MM/AAAA</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions / View Mode */}
            <div className="flex items-center justify-end gap-2 w-full lg:w-auto lg:ml-auto">
              {(startDate || endDate || search || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); setSearch(''); setTypeFilter('ALL'); setStatusFilter('ALL'); }}
                  className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Réinitialiser"
                >
                  <RefreshCw size={18} />
                </button>
              )}
              <div className="h-8 w-px bg-slate-100 mx-2" />
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <LayoutList size={18} />
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:p-0 bg-slate-50 lg:bg-white lg:rounded-2xl lg:border-2 lg:border-slate-200 lg:shadow-lg lg:shadow-slate-100/50 lg:overflow-hidden">
            {/* Mobile / tablet cards */}
            <div className="lg:hidden space-y-4 sm:space-y-5">
              {paginatedData.map((item) => {
                const normalizedType = normalizeTypeKey(item.type)
                const st = statusConfig[item.status] || fallbackStatus
                const ty = typeConfig[normalizedType] || fallbackType
                const TyIcon = ty.icon || Wrench
                const isHighlighted = String(item.id) === String(highlightId)
                const isAssigned = Boolean(String(item.assignee || '').trim()) || Boolean(String(item.assignedTo || '').trim()) || Boolean(String(item.technicianName || '').trim()) || Boolean(item.hasLinkedMission)
                return (
                  <div
                    key={item.id}
                    ref={isHighlighted ? highlightRowRef : null}
                    className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-5 transition active:scale-[0.99] sm:hover:shadow-md ${isHighlighted ? 'ring-2 ring-emerald-200 animate-pulse' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${ty.color}`}>
                        <TyIcon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-900 truncate">{item.machine}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase truncate">{item.id}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[9px] font-black uppercase text-[#004a77] truncate">{ty.label}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black border-2 uppercase tracking-wider shrink-0 ${st.color}`}>
                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 min-w-0">
                        <Building2 size={14} className="text-slate-300 shrink-0" />
                        <span className="truncate">{item.client}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Calendar size={14} className="text-blue-500 shrink-0" />
                        <span className="truncate">{item.date}</span>
                      </div>
                      {item.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                            {item.assignee.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate">{item.assignee}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-500">
                          <AlertTriangle size={12} />
                          <span className="text-[10px] font-black uppercase tracking-wider italic">Non affecté</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleNavigate('details', item) }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-[#004a77] bg-[#004a77]/5 hover:bg-[#004a77] hover:text-white rounded-xl transition-all border border-[#004a77]/10 active:scale-95"
                      >
                        <Eye size={12} strokeWidth={3} /> Consulter
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleNavigate('edit', item) }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-[#004a77] bg-[#004a77]/5 hover:bg-[#004a77] hover:text-white rounded-xl transition-all border border-[#004a77]/10 active:scale-95"
                      >
                        <Edit2 size={12} strokeWidth={3} /> Modifier
                      </button>
                      <button
                        disabled={isAssigned}
                        onClick={(e) => { e.stopPropagation(); if (!isAssigned) handleNavigate('assign', item) }}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border active:scale-95 ${
                          isAssigned
                            ? 'text-slate-300 bg-slate-100 border-slate-200 cursor-not-allowed pointer-events-none'
                            : 'text-[#004a77] bg-[#004a77]/5 hover:bg-[#004a77] hover:text-white border-[#004a77]/10'
                        }`}
                      >
                        <UserCheck2 size={12} strokeWidth={3} /> Affecter
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleNavigate('delete', item) }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-100 active:scale-95"
                      >
                        <Trash2 size={12} strokeWidth={3} /> Supprimer
                      </button>
                    </div>
                  </div>
                )
              })}
              {paginatedData.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-100">
                      <Search size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-black text-slate-400">Aucune intervention trouvée</p>
                      <p className="text-sm text-slate-300 font-bold">Modifiez vos filtres ou effectuez une nouvelle recherche</p>
                    </div>
                    <button onClick={() => { setStartDate(''); setEndDate(''); setSearch(''); setTypeFilter('ALL'); setStatusFilter('ALL'); }} className="mt-1 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">EFFACER LES FILTRES</button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[860px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100">
                    <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 last:border-0">ID / Machine</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 last:border-0">Client / Site</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center border-r border-slate-100 last:border-0">Statut</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 last:border-0">Date d'intervention</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 last:border-0">Technicien</th>
                    <th className="px-4 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center w-[200px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((item, idx) => {
                    const normalizedType = normalizeTypeKey(item.type)
                    const st = statusConfig[item.status] || fallbackStatus
                    const ty = typeConfig[normalizedType] || fallbackType
                    const TyIcon = ty.icon || Wrench
                    const isHighlighted = String(item.id) === String(highlightId)
                    return (
                      <tr
                        key={item.id}
                        ref={isHighlighted ? highlightRowRef : null}
                        className={`transition-colors group ${
                          isHighlighted
                            ? 'bg-emerald-50 ring-2 ring-emerald-200 animate-pulse'
                            : `hover:bg-blue-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`
                        }`}
                      >
                        <td className="px-6 py-4 border-r border-slate-50 last:border-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${ty.color}`}>
                              <TyIcon size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-black text-slate-900 leading-none mb-1.5 group-hover:text-blue-600 transition-colors truncate">{item.machine}</p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight truncate">{item.id}</span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span className="text-[9px] font-black uppercase text-[#004a77] truncate">{ty.label}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-50 last:border-0">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 min-w-0">
                            <Building2 size={14} className="text-slate-300 shrink-0" />
                            <span className="truncate">{item.client}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-slate-50 last:border-0">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border-2 uppercase tracking-wider ${st.color}`}>
                            <span className={`w-2 h-2 rounded-full shadow-sm ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-50 last:border-0">
                          <div className="flex items-center gap-2 text-xs font-black text-slate-600 min-w-0">
                            <Calendar size={16} className="text-blue-500 shrink-0" />
                            <span className="truncate">{item.date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-50 last:border-0">
                          {item.assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-blue-100">
                                {item.assignee.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-xs font-bold text-slate-800">{item.assignee}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-500">
                              <AlertTriangle size={12} />
                              <span className="text-[10px] font-black uppercase tracking-wider italic">Non affecté</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 w-[200px]">
                          <div className="grid grid-cols-2 gap-1.5 w-[184px] mx-auto">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleNavigate('details', item) }}
                              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#004a77] bg-[#004a77]/5 hover:bg-[#004a77] hover:text-white rounded-xl transition-all shadow-sm border border-[#004a77]/10 active:scale-95"
                            >
                              <Eye size={12} strokeWidth={3} />
                              Consulter
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleNavigate('edit', item) }}
                              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#004a77] bg-[#004a77]/5 hover:bg-[#004a77] hover:text-white rounded-xl transition-all shadow-sm border border-[#004a77]/10 active:scale-95"
                            >
                              <Edit2 size={12} strokeWidth={3} />
                              Modifier
                            </button>
                            <button 
                              disabled={Boolean(item.assignee) || item.status === 'ASSIGNED'}
                              onClick={(e) => { e.stopPropagation(); handleNavigate('assign', item) }}
                              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm border active:scale-95 ${
                                Boolean(String(item.assignee || '').trim()) || Boolean(String(item.assignedTo || '').trim()) || Boolean(String(item.technicianName || '').trim()) || Boolean(item.hasLinkedMission)
                                  ? 'text-slate-300 bg-slate-100 border-slate-200 cursor-not-allowed pointer-events-none'
                                  : 'text-[#004a77] bg-[#004a77]/5 hover:bg-[#004a77] hover:text-white border-[#004a77]/10'
                              }`}
                            >
                              <UserCheck2 size={12} strokeWidth={3} />
                              Affecter
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleNavigate('delete', item) }}
                              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm border border-red-100 active:scale-95"
                            >
                              <Trash2 size={12} strokeWidth={3} />
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-100">
                            <Search size={40} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-black text-slate-400">Aucune intervention trouvée</p>
                            <p className="text-sm text-slate-300 font-bold">Modifiez vos filtres ou effectuez une nouvelle recherche</p>
                          </div>
                          <button onClick={() => { setStartDate(''); setEndDate(''); setSearch(''); setTypeFilter('ALL'); setStatusFilter('ALL'); }} className="mt-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">EFFACER LES FILTRES</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 lg:mt-0 bg-white rounded-2xl border border-slate-200 shadow-sm lg:rounded-none lg:border-0 lg:border-t lg:border-slate-100 lg:shadow-none lg:bg-slate-50/50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} sur {totalPages}</span>
                  <div className="h-4 w-px bg-slate-200 mx-2" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{filtered.length} résultats au total</span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft size={14} strokeWidth={3} /> Précédent
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="flex items-center gap-2 px-6 py-2 bg-[#0052CC] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-30 disabled:pointer-events-none transition-all group"
                  >
                    Suivant <ChevronRightIcon size={14} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar min-h-[420px] sm:min-h-[500px]">
            {Object.entries(statusConfig).map(([statusKey, st]) => {
              const items = filtered.filter(i => i.status === statusKey)
              return (
                <div key={statusKey} className="flex-shrink-0 w-[18rem] sm:w-80 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{st.label}</h3>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{items.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-3">
                    {items.map(item => {
                      const ty = typeConfig[item.type]
                      return (
                        <div 
                          key={item.id} 
                          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden"
                        >
                          <div className={`absolute top-0 left-0 w-1 h-full ${st.bar}`} />
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">{item.id}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${ty.color}`}>
                              {ty.label}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 leading-tight mb-1.5 group-hover:text-blue-600 transition-colors">{item.machine}</h4>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                              <Building2 size={12} className="text-slate-300" />
                              {item.client}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                              <Calendar size={12} className="text-slate-300" />
                              {item.date}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                            {item.assignee ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-[8px] font-black border border-blue-100">
                                  {item.assignee.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="text-[10px] font-bold text-slate-600">{item.assignee.split(' ')[0]}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">À affecter</span>
                            )}
                            <div className="flex items-center gap-1">
                              <ActionMenu item={item} onNavigate={handleNavigate} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {items.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center bg-slate-50/30">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Vide</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
