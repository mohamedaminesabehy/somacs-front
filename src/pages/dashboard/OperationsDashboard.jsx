import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  LayoutDashboard,
  Layers,
  PlusCircle,
  Send,
  UserPlus,
  UserRound,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { isSameMonthYear, parseDateLike, relativeDateLabel } from '../../utils/date'
import { useOperationsDashboardData } from './hooks/useOperationsDashboardData'

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const missionStatuses = ['À faire', 'En cours', 'Terminée', 'Bloquée']
const interventionStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'CLOSED']

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const missionStatusLabel = {
  'À faire': 'À faire',
  'En cours': 'En cours',
  Terminée: 'Terminée',
  Bloquée: 'Bloquée',
}

const interventionStatusLabel = {
  PENDING: 'En attente',
  ASSIGNED: 'Affectée',
  IN_PROGRESS: 'En cours',
  CLOSED: 'Clôturée',
}

const statusTone = {
  'À faire': 'bg-blue-50 text-blue-700 border-blue-200',
  'En cours': 'bg-amber-50 text-amber-700 border-amber-200',
  Terminée: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Bloquée: 'bg-red-50 text-red-700 border-red-200',
  PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
  ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  CLOSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

/* -------------------------------------------------------------------------- */
/*  Utilities                                                                 */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Primitive UI components                                                   */
/* -------------------------------------------------------------------------- */

function ProgressBar({ value, tone = 'bg-[#0052CC]' }) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${tone}`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

function StatusRowsList({ rows }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-600">{row.label}</span>
            <span className="font-semibold text-slate-800">{row.count}</span>
          </div>
          <ProgressBar value={row.pct} tone={row.tone} />
        </div>
      ))}
    </div>
  )
}

function BarChart({ items, height = 140 }) {
  const safeItems = Array.isArray(items) ? items : []
  const max = Math.max(1, ...safeItems.map((it) => Number(it.value) || 0))
  const isDense = safeItems.length > 8

  return (
    <div className="overflow-x-auto pb-1">
      <div className={`flex items-end ${isDense ? 'gap-3 min-w-max' : 'gap-3 sm:gap-4'}`}>
        {safeItems.map((it) => {
          const v = Number(it.value) || 0
          const h = `${Math.max(4, Math.min(100, (v / max) * 100))}%`
          return (
            <div
              key={it.key || it.label}
              className={isDense ? 'shrink-0 w-16' : 'shrink-0 w-20 sm:flex-1 sm:min-w-[80px]'}
            >
              <div
                className="w-full rounded bg-slate-50 border border-slate-200 overflow-hidden flex items-end p-1.5"
                style={{ height }}
              >
                <div
                  className="w-full rounded-sm transition-all duration-500"
                  style={{ height: h, background: it.color }}
                />
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-[10px] font-medium text-slate-500 truncate">{it.label}</p>
                <p className="text-sm font-semibold text-slate-800">{v}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DonutChart({ segments, size = 160, thickness = 16 }) {
  const safeSegments = Array.isArray(segments) ? segments : []
  const total = safeSegments.reduce((sum, s) => sum + (Number(s.value) || 0), 0)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const renderedSegments = safeSegments.reduce((acc, seg) => {
    const v = Number(seg.value) || 0
    const portion = total > 0 ? v / total : 0
    const dash = Math.max(0, Math.min(c, portion * c))
    const dashOffset = acc.offset
    return {
      offset: acc.offset + dash,
      items: dash
        ? [...acc.items, { ...seg, dash, dashOffset }]
        : acc.items,
    }
  }, { offset: 0, items: [] }).items

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(226 232 240)" strokeWidth={thickness} />
        {renderedSegments.map((seg) => (
          <circle
            key={seg.key || seg.label}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${seg.dash} ${c - seg.dash}`}
            strokeDashoffset={-seg.dashOffset}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <p className="text-2xl font-bold text-slate-900 leading-none">{total}</p>
        <p className="mt-1 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Devis</p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Month/Year picker modal                                                   */
/* -------------------------------------------------------------------------- */

function MonthYearModal({ open, month, year, yearOptions, onChangeMonth, onChangeYear, onClose, onApply }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Sélection de la période">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <CalendarDays size={16} className="text-[#0052CC]" />
            <h2 className="text-sm font-semibold text-slate-900">Sélection de la période</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
            aria-label="Fermer"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Mois</label>
              <select
                value={month}
                onChange={(e) => onChangeMonth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]"
              >
                {MONTHS_FR.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Année</label>
              <select
                value={year}
                onChange={(e) => onChangeYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onApply}
              className="px-5 py-2 rounded-md bg-[#0052CC] text-white text-sm font-medium hover:bg-[#0042a3] transition-colors"
            >
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  KPI Card                                                                  */
/* -------------------------------------------------------------------------- */

const kpiToneMap = {
  blue:    { icon: 'bg-blue-50 border-blue-100 text-[#0052CC]',    value: 'text-slate-900' },
  emerald: { icon: 'bg-emerald-50 border-emerald-100 text-emerald-700', value: 'text-slate-900' },
  amber:   { icon: 'bg-amber-50 border-amber-100 text-amber-700',  value: 'text-slate-900' },
  slate:   { icon: 'bg-slate-100 border-slate-200 text-slate-600', value: 'text-slate-900' },
  red:     { icon: 'bg-red-50 border-red-100 text-red-600',        value: 'text-red-700' },
}

function KpiCard({ title, value, subtitle, icon, tone = 'blue' }) {
  const KpiIcon = icon
  const colors = kpiToneMap[tone] || kpiToneMap.blue
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 leading-snug">{title}</p>
        <div className={`h-8 w-8 rounded-md border flex items-center justify-center shrink-0 ${colors.icon}`}>
          <KpiIcon size={16} />
        </div>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${colors.value}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-500 leading-snug">{subtitle}</p>}
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/*  Alert banner (inline, dismissible)                                        */
/* -------------------------------------------------------------------------- */

function AlertBanner({ alerts }) {
  const active = alerts.filter((a) => a.value > 0)
  if (active.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
      <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-800 mb-1">Points d'attention</p>
        <ul className="space-y-0.5">
          {active.map((a) => (
            <li key={a.title} className="text-xs text-amber-700 flex items-center gap-2">
              <span className="font-bold">{a.value}</span>
              <span>{a.title.toLowerCase()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Card wrapper                                                              */
/* -------------------------------------------------------------------------- */

function Card({ title, subtitle, icon, children, className = '' }) {
  const CardIcon = icon
  return (
    <article className={`rounded-lg border border-slate-200 bg-white overflow-hidden ${className}`}>
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800 truncate">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 truncate">{subtitle}</p>}
        </div>
        {CardIcon && (
          <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md bg-slate-100 text-slate-500 border border-slate-200">
            <CardIcon size={15} />
          </div>
        )}
      </header>
      <div className="px-5 py-4">{children}</div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
const MISSION_PROGRESS_TONE = {
  'À faire': 'bg-[#0052CC]',
  'En cours': 'bg-amber-500',
  Terminée: 'bg-emerald-500',
  Bloquée: 'bg-red-500',
}

const INTERVENTION_PROGRESS_TONE = {
  PENDING: 'bg-slate-400',
  ASSIGNED: 'bg-[#0052CC]',
  IN_PROGRESS: 'bg-amber-500',
  CLOSED: 'bg-emerald-500',
}

/* -------------------------------------------------------------------------- */

export default function OperationsDashboard({ currentUser }) {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [draftMonth, setDraftMonth] = useState(() => new Date().getMonth())
  const [draftYear, setDraftYear] = useState(() => new Date().getFullYear())
  const [currentActivityPage, setCurrentActivityPage] = useState(1)

  const { isLoading, users, missions, interventions, machines, devis, devisTotals } =
    useOperationsDashboardData({ selectedMonth, selectedYear })

  const yearOptions = useMemo(() => {
    const years = new Set()
    const addYear = (value) => {
      const d = parseDateLike(value)
      if (d instanceof Date && !Number.isNaN(d.getTime())) years.add(d.getFullYear())
    }

    // Dérive les années à partir des données réellement disponibles
    missions.forEach((m) => addYear(m?.dueDate || m?.updatedAt || m?.createdAt))
    interventions.forEach((itv) => addYear(itv?.date || itv?.interventionDate || itv?.updatedAt || itv?.createdAt))
    machines.forEach((m) => addYear(m?.updatedAt || m?.createdAt || m?.receptionDate))
    devis.forEach((d) => addYear(d?.DOCDATE || d?.DATEDOC || d?.DateDoc || d?.DATDOC || d?.createdAt))

    // Garantit toujours l'année courante et l'année sélectionnée
    years.add(today.getFullYear())
    years.add(selectedYear)

    // Repli si aucune donnée datée : fenêtre autour de l'année courante
    if (years.size <= 1) {
      const base = today.getFullYear()
      for (let i = base - 2; i <= base + 1; i += 1) years.add(i)
    }

    return Array.from(years).sort((a, b) => b - a)
  }, [missions, interventions, machines, devis, today, selectedYear])

  const selectedLabel = useMemo(
    () => `${MONTHS_FR[selectedMonth]} ${selectedYear}`,
    [selectedMonth, selectedYear],
  )

  /* ── Filtered data ── */

  const filteredMissions = useMemo(() =>
    missions.filter((m) => isSameMonthYear(parseDateLike(m?.dueDate || m?.updatedAt || m?.createdAt), selectedMonth, selectedYear)),
    [missions, selectedMonth, selectedYear],
  )

  const filteredInterventions = useMemo(() =>
    interventions.filter((itv) => isSameMonthYear(parseDateLike(itv?.date || itv?.interventionDate || itv?.updatedAt || itv?.createdAt), selectedMonth, selectedYear)),
    [interventions, selectedMonth, selectedYear],
  )

  const filteredMachines = useMemo(() =>
    machines.filter((m) => isSameMonthYear(parseDateLike(m?.updatedAt || m?.createdAt || m?.receptionDate), selectedMonth, selectedYear)),
    [machines, selectedMonth, selectedYear],
  )

  /* ── Analytics ── */

  const analytics = useMemo(() => {
    const activeUsers = users.filter((u) => Boolean(u?.isActive)).length

    const missionCounts = missionStatuses.reduce((acc, key) => {
      acc[key] = filteredMissions.filter((m) => String(m?.status || '').trim() === key).length
      return acc
    }, {})

    const missionOpen = missionCounts['À faire'] + missionCounts['En cours'] + missionCounts.Bloquée

    const interventionCounts = interventionStatuses.reduce((acc, key) => {
      acc[key] = filteredInterventions.filter((itv) => String(itv?.status || '').trim() === key).length
      return acc
    }, {})

    const interventionOpen = interventionCounts.PENDING + interventionCounts.ASSIGNED + interventionCounts.IN_PROGRESS

    const highPriorityInterventions = filteredInterventions.filter((itv) => {
      const p = String(itv?.priority || '').toLowerCase()
      return p === 'critique' || p === 'haute'
    }).length

    const machinesWithDocs = machines.filter((m) => {
      try {
        const docs = m?.documentsJson ? JSON.parse(m.documentsJson) : []
        return Array.isArray(docs) && docs.length > 0
      } catch { return false }
    }).length

    const alerts = [
      {
        title: 'Interventions non affectées',
        value: filteredInterventions.filter((itv) => {
          const status = String(itv?.status || '').trim()
          const hasAgent = Boolean(String(itv?.assignee || itv?.assignedTo || itv?.technicianName || '').trim())
          return status !== 'CLOSED' && !hasAgent
        }).length,
        severity: 'medium',
      },
      {
        title: 'Missions bloquées',
        value: missionCounts.Bloquée,
        severity: missionCounts.Bloquée > 0 ? 'high' : 'low',
      },
      {
        title: 'Machines sans documentation',
        value: Math.max(machines.length - machinesWithDocs, 0),
        severity: machines.length - machinesWithDocs > 0 ? 'medium' : 'low',
      },
    ]

    return {
      activeUsers,
      missionCounts,
      missionOpen,
      interventionCounts,
      interventionOpen,
      highPriorityInterventions,
      machinesWithDocs,
      alerts,
    }
  }, [users, machines, filteredMissions, filteredInterventions])

  /* ── Derived chart data ── */

  const missionTotal = filteredMissions.length || 1
  const interventionTotal = filteredInterventions.length || 1

  const missionStatusRows = useMemo(() =>
    missionStatuses.map((status) => {
      const count = analytics.missionCounts[status] || 0
      return { key: status, label: missionStatusLabel[status], count, pct: (count / missionTotal) * 100, tone: MISSION_PROGRESS_TONE[status] || 'bg-slate-400' }
    }),
    [analytics.missionCounts, missionTotal],
  )

  const interventionStatusRows = useMemo(() =>
    interventionStatuses.map((status) => {
      const count = analytics.interventionCounts[status] || 0
      return { key: status, label: interventionStatusLabel[status], count, pct: (count / interventionTotal) * 100, tone: INTERVENTION_PROGRESS_TONE[status] || 'bg-slate-400' }
    }),
    [analytics.interventionCounts, interventionTotal],
  )

  const docPct = machines.length ? Math.round((analytics.machinesWithDocs / machines.length) * 100) : 0

  const closedMissionsByEmployee = useMemo(() => {
    const rows = filteredMissions.filter((m) => String(m?.status || '').trim() === 'Terminée')
    const counts = new Map()
    for (const m of rows) {
      const id = m?.employeeUserId != null ? Number(m.employeeUserId) : null
      const name = String(m?.employee || '').trim()
      const key = id != null && !Number.isNaN(id) ? `id:${id}` : name || 'Sans employé'
      const label = name || (id != null && !Number.isNaN(id) ? `Employé #${id}` : 'Sans employé')
      const prev = counts.get(key) || { key, label, value: 0 }
      counts.set(key, { ...prev, value: prev.value + 1 })
    }
    return Array.from(counts.values()).sort((a, b) => b.value - a.value)
  }, [filteredMissions])

  const topCloser = closedMissionsByEmployee[0] || null

  const employeeComparisonChart = useMemo(() => {
    const palette = ['#2563EB', '#0EA5E9', '#14B8A6', '#F59E0B', '#F97316', '#8B5CF6', '#64748B']
    return closedMissionsByEmployee.slice(0, 7).map((row, idx) => ({
      key: row.key, label: row.label, value: row.value, color: palette[idx] || '#2563EB',
    }))
  }, [closedMissionsByEmployee])

  const mockDevisCounts = useMemo(() => {
    const seed = (selectedYear * 100 + (selectedMonth + 1)) % 97
    return { validated: 8 + (seed % 10), pending: 3 + (seed % 6), notValidated: 2 + (seed % 5) }
  }, [selectedMonth, selectedYear])

  const devisPie = useMemo(() => {
    const isMock = devisTotals.total === 0 && Boolean(import.meta?.env?.DEV)
    const counts = isMock
      ? mockDevisCounts
      : { validated: devisTotals.valides, pending: devisTotals.enAttente, notValidated: devisTotals.nonValides }

    return {
      isMock,
      segments: [
        { key: 'validated',    label: 'Validés',     value: counts.validated,    color: '#10B981', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { key: 'pending',      label: 'En attente',  value: counts.pending,      color: '#F59E0B', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
        { key: 'notValidated', label: 'Non validés', value: counts.notValidated, color: '#EF4444', pill: 'bg-red-50 text-red-700 border-red-200' },
      ],
    }
  }, [devisTotals, mockDevisCounts])

  const recentActivity = useMemo(() => {
    const missionItems = filteredMissions.slice(0, 12).map((m) => ({
      id: `mission-${m?.id}`,
      kind: 'mission',
      title: m?.title || `Mission #${m?.id || ''}`,
      status: m?.status || 'À faire',
      date: parseDateLike(m?.dueDate || m?.updatedAt || m?.createdAt),
      rawDate: m?.dueDate || m?.updatedAt || m?.createdAt,
      meta: m?.employee || 'Aucun technicien',
    }))
    const interventionItems = filteredInterventions.slice(0, 12).map((itv) => ({
      id: `intervention-${itv?.id}`,
      kind: 'intervention',
      title: `Intervention ${itv?.id || ''}`,
      status: itv?.status || 'PENDING',
      date: parseDateLike(itv?.date || itv?.interventionDate),
      rawDate: itv?.date || itv?.interventionDate,
      meta: itv?.client || itv?.clientName || 'Client non précisé',
    }))
    const machineItems = filteredMachines.slice(0, 10).map((m) => ({
      id: `machine-${m?.id}`,
      kind: 'machine',
      title: m?.designation || `Machine ${m?.code || ''}`,
      status: m?.status || 'Actif',
      date: parseDateLike(m?.updatedAt || m?.createdAt || m?.receptionDate),
      rawDate: m?.updatedAt || m?.createdAt || m?.receptionDate,
      meta: m?.supplier || 'Sans fournisseur',
    }))
    return [...missionItems, ...interventionItems, ...machineItems]
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
      .slice(0, 10)
  }, [filteredMissions, filteredInterventions, filteredMachines])

  const quickActions = useMemo(() => [
    { label: 'Affecter une mission',   hint: 'Planifier une intervention terrain', to: '/missions/assign',       icon: Send },
    { label: 'Nouveau dossier SAV',    hint: 'Créer une intervention',             to: '/interventions/create',  icon: PlusCircle },
    { label: 'Créer un devis',         hint: 'Lancer un devis commercial',         to: '/devis/create',          icon: FileText },
    { label: 'Ajouter un utilisateur', hint: 'Administrer les accès équipe',       to: '/users',                 icon: UserPlus },
  ], [])

  const activityKindMeta = {
    mission:      { label: 'Mission',       tone: 'text-blue-700 bg-blue-50 border-blue-100',   dot: 'bg-[#0052CC]' },
    intervention: { label: 'Intervention',  tone: 'text-amber-700 bg-amber-50 border-amber-100', dot: 'bg-amber-500' },
    machine:      { label: 'Machine',       tone: 'text-slate-600 bg-slate-100 border-slate-200', dot: 'bg-slate-400' },
  }

  const devisTotal = devisPie.segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0)

  /* ------------------------------- Render -------------------------------- */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-[#0052CC] rounded-md flex items-center justify-center shrink-0">
              <LayoutDashboard size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-slate-900 truncate">Tableau de bord opérationnel</h1>
              <p className="text-[11px] text-slate-500 truncate">
                {currentUser?.name || currentUser?.username || 'Utilisateur'} · MAJ {today.toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setDraftMonth(selectedMonth); setDraftYear(selectedYear); setMonthPickerOpen(true) }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors shrink-0"
          >
            <CalendarDays size={14} />
            <span className="hidden sm:inline">{selectedLabel}</span>
            <span className="sm:hidden">Période</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 space-y-5">

        <MonthYearModal
          open={monthPickerOpen}
          month={draftMonth}
          year={draftYear}
          yearOptions={yearOptions}
          onChangeMonth={setDraftMonth}
          onChangeYear={setDraftYear}
          onClose={() => setMonthPickerOpen(false)}
          onApply={() => { setSelectedMonth(draftMonth); setSelectedYear(draftYear); setMonthPickerOpen(false) }}
        />

        {/* ── Row 1: Alerts (only when there are issues) ── */}
        {!isLoading && <AlertBanner alerts={analytics.alerts} />}

        {/* ── Row 2: KPI strip ── */}
        <section aria-label="Indicateurs clés" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard
            title="Missions ouvertes"
            value={isLoading ? '—' : analytics.missionOpen}
            subtitle={isLoading ? '' : `${analytics.missionCounts['En cours']} en cours · ${analytics.missionCounts.Bloquée} bloquées`}
            icon={ClipboardList}
            tone="blue"
          />
          <KpiCard
            title="Interventions actives"
            value={isLoading ? '—' : analytics.interventionOpen}
            subtitle={isLoading ? '' : `${analytics.highPriorityInterventions} haute priorité`}
            icon={Wrench}
            tone="amber"
          />
          <KpiCard
            title="Utilisateurs actifs"
            value={isLoading ? '—' : analytics.activeUsers}
            subtitle={isLoading ? '' : `${users.length} comptes au total`}
            icon={UserRound}
            tone="emerald"
          />
          <KpiCard
            title="Devis validés"
            value={isLoading ? '—' : devisTotals.valides}
            subtitle={isLoading ? '' : `${devisTotals.nonValides} refusés/expirés/bloqués · ${selectedLabel}`}
            icon={CheckCircle2}
            tone="slate"
          />
        </section>

        {/* ── Row 3: Status breakdowns ── */}
        <section aria-label="Répartition par statut" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {/* Missions by status */}
          <Card title="Missions" subtitle={`Répartition par statut — ${selectedLabel}`} icon={ClipboardList}>
            {isLoading ? (
              <SkeletonRows count={4} />
            ) : (
              <StatusRowsList rows={missionStatusRows} />
            )}
          </Card>

          {/* Interventions by status */}
          <Card title="Interventions" subtitle={`Répartition par statut — ${selectedLabel}`} icon={Wrench}>
            {isLoading ? (
              <SkeletonRows count={4} />
            ) : (
              <StatusRowsList rows={interventionStatusRows} />
            )}
          </Card>

          {/* Machines documentation */}
          <Card title="Parc machines" subtitle="Couverture documentaire" icon={Layers}>
            {isLoading ? (
              <SkeletonRows count={2} />
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600">Machines documentées</span>
                    <span className="font-semibold text-slate-800">
                      {analytics.machinesWithDocs} / {machines.length}
                    </span>
                  </div>
                  <ProgressBar value={docPct} tone="bg-[#0052CC]" />
                </div>
                <p className="text-xs text-slate-500">
                  {docPct}% du parc dispose d'au moins un document PDF associé.
                </p>
                <div className="pt-1 border-t border-slate-100">
                  <p className="text-xs text-slate-500">Total machines</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{machines.length}</p>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* ── Row 4: Performance + Devis ── */}
        <section aria-label="Performance et devis" className="grid grid-cols-1 gap-4 xl:grid-cols-12">

          {/* Team performance */}
          <div className="xl:col-span-8">
            <Card title="Performance équipe" subtitle={`Missions clôturées — ${selectedLabel}`} icon={Users}>
              {isLoading ? (
                <SkeletonRows count={3} />
              ) : employeeComparisonChart.length === 0 ? (
                <EmptyState text="Aucune mission clôturée sur la période sélectionnée." />
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs text-slate-500">Top clôture</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 truncate">{topCloser?.label || '—'}</p>
                      <p className="text-xs text-slate-500">{topCloser ? `${topCloser.value} mission(s)` : '—'}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs text-slate-500">Total clôturées</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {closedMissionsByEmployee.reduce((sum, r) => sum + (Number(r.value) || 0), 0)}
                      </p>
                      <p className="text-xs text-slate-500">Sur la période</p>
                    </div>
                  </div>
                  <BarChart items={employeeComparisonChart} height={140} />
                </div>
              )}
            </Card>
          </div>

          {/* Devis donut */}
          <div className="xl:col-span-4">
            <Card
              title="Devis"
              subtitle={`${selectedLabel}${devisPie.isMock ? ' · données simulées' : ''}`}
              icon={FileText}
            >
              {isLoading ? (
                <SkeletonRows count={3} />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <DonutChart segments={devisPie.segments} size={160} thickness={16} />
                  <div className="w-full space-y-2">
                    {devisPie.segments.map((seg) => (
                      <div key={seg.key} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: seg.color }} />
                          <span className="text-xs text-slate-700 truncate">{seg.label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-slate-800">{seg.value}</span>
                          <span className="text-[10px] text-slate-400">
                            {devisTotal > 0 ? `${Math.round(((Number(seg.value) || 0) / devisTotal) * 100)}%` : '0%'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </section>

        {/* ── Row 5: Activity feed + Quick actions ── */}
        <section aria-label="Activité et actions" className="grid grid-cols-1 gap-4 xl:grid-cols-12">

          {/* Recent activity */}
          <div className="xl:col-span-8">
            <Card title="Activité récente" subtitle={`Derniers événements — ${selectedLabel}`} icon={Activity}>
              {isLoading ? (
                <SkeletonRows count={5} />
              ) : recentActivity.length === 0 ? (
                <EmptyState text="Aucune activité récente sur la période sélectionnée." />
              ) : (() => {
                const ACTIVITY_PER_PAGE = 6
                const totalActivityPages = Math.ceil(recentActivity.length / ACTIVITY_PER_PAGE)
                const safeActivityPage = Math.min(currentActivityPage, totalActivityPages)
                const activityVisible = recentActivity.slice((safeActivityPage - 1) * ACTIVITY_PER_PAGE, safeActivityPage * ACTIVITY_PER_PAGE)
                return (
                  <>
                    <div className="divide-y divide-slate-100">
                      {activityVisible.map((item) => {
                        const meta = activityKindMeta[item.kind]
                        return (
                          <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                            <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${meta?.dot || 'bg-slate-400'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${statusTone[item.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                  {missionStatusLabel[item.status] || interventionStatusLabel[item.status] || item.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-xs text-slate-500 truncate">{item.meta}</span>
                                <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                                  <Clock3 size={11} />
                                  {relativeDateLabel(item.rawDate)}
                                </span>
                                <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${meta?.tone || 'text-slate-600 bg-slate-100 border-slate-200'}`}>
                                  {meta?.label || item.kind}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {totalActivityPages > 1 && (
                      <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => setCurrentActivityPage((p) => Math.max(1, p - 1))}
                          disabled={safeActivityPage <= 1}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          ←
                        </button>
                        <span className="text-xs font-bold text-slate-500">
                          {safeActivityPage} / {totalActivityPages}
                        </span>
                        <button
                          onClick={() => setCurrentActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                          disabled={safeActivityPage >= totalActivityPages}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          →
                        </button>
                      </div>
                    )}
                  </>
                )
              })()}
            </Card>
          </div>

          {/* Quick actions */}
          <div className="xl:col-span-4">
            <Card title="Actions rapides" subtitle="Raccourcis opérationnels">
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => navigate(action.to)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-left transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-[#0052CC] transition-colors">
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{action.label}</p>
                        <p className="text-xs text-slate-500 truncate">{action.hint}</p>
                      </div>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                    </button>
                  )
                })}
              </div>
            </Card>
          </div>
        </section>

      </main>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Skeleton & empty state helpers                                            */
/* -------------------------------------------------------------------------- */

function SkeletonRows({ count = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-2.5 w-3/4 bg-slate-100 rounded" />
          <div className="h-1.5 w-full bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  )
}
