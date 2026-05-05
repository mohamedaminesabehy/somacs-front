import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  HardDrive,
  LayoutDashboard,
  Layers,
  PlusCircle,
  Send,
  Sparkles,
  Trophy,
  UserPlus,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'
import { apiFetch } from '../../api/apiClient'

const missionStatuses = ['À faire', 'En cours', 'Terminée', 'Bloquée']
const interventionStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'CLOSED']

const MONTHS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
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
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  CLOSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function parseDateLike(value) {
  if (!value) return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  const raw = String(value).trim()
  if (!raw) return null

  if (raw.toLowerCase() === "aujourd'hui" || raw.toLowerCase() === 'aujourd\'hui') {
    return new Date()
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('/').map((n) => Number(n))
    const built = new Date(y, m - 1, d)
    if (!Number.isNaN(built.getTime())) return built
  }

  return null
}

function relativeDateLabel(value) {
  const date = parseDateLike(value)
  if (!date) return 'Date non précisée'

  const today = new Date()
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))

  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Hier'
  if (diff > 1 && diff <= 30) return `Il y a ${diff} jours`
  if (diff < 0 && Math.abs(diff) <= 30) return `Dans ${Math.abs(diff)} jours`

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function isSameMonthYear(date, month, year) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false
  return date.getMonth() === month && date.getFullYear() === year
}

function ProgressBar({ value, tone = 'bg-[#0052CC]' }) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${tone}`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

function BarChart({ items, height = 150 }) {
  const safeItems = Array.isArray(items) ? items : []
  const max = Math.max(1, ...safeItems.map((it) => Number(it.value) || 0))
  const isDense = safeItems.length > 8

  return (
    <div className="overflow-x-auto pb-2">
      <div className={`flex items-end min-w-max ${isDense ? 'gap-4' : 'gap-4 sm:gap-5 sm:min-w-0'}`}>
        {safeItems.map((it) => {
          const v = Number(it.value) || 0
          const h = `${Math.max(0, Math.min(100, (v / max) * 100))}%`
          return (
            <div
              key={it.key || it.label}
              className={
                isDense
                  ? 'shrink-0 w-[72px] sm:w-[84px]'
                  : 'shrink-0 w-[96px] sm:flex-1 sm:min-w-[120px]'
              }
            >
              <div
                className="w-full rounded-2xl bg-slate-50 overflow-hidden border border-slate-200 p-2 flex items-end"
                style={{ height }}
              >
                <div className="w-full rounded-xl" style={{ height: h, background: it.color }} />
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                  {it.label}
                </p>
                <p className="text-sm font-black text-slate-900 leading-none">{v}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DonutChart({ segments, size = 180, thickness = 18 }) {
  const safeSegments = Array.isArray(segments) ? segments : []
  const total = safeSegments.reduce((sum, s) => sum + (Number(s.value) || 0), 0)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(226 232 240)"
          strokeWidth={thickness}
        />
        {safeSegments.map((seg) => {
          const v = Number(seg.value) || 0
          const portion = total > 0 ? v / total : 0
          const dash = Math.max(0, Math.min(c, portion * c))
          const dashOffset = offset
          offset += dash
          if (!dash) return null
          return (
            <circle
              key={seg.key || seg.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-dashOffset}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-2xl font-black text-slate-900 leading-none">{total}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">Devis</p>
      </div>
    </div>
  )
}

function MonthYearModal({
  open,
  month,
  year,
  yearOptions,
  onChangeMonth,
  onChangeYear,
  onClose,
  onApply,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center border border-blue-100">
              <CalendarDays size={18} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Période</p>
              <p className="mt-0.5 text-sm font-black text-slate-900">Sélection mois & année</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mois</label>
              <select
                value={month}
                onChange={(e) => onChangeMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/25"
              >
                {MONTHS_FR.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Année</label>
              <select
                value={year}
                onChange={(e) => onChangeYear(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/25"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-black"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onApply}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#0052CC] text-white text-xs font-black shadow-lg shadow-blue-200 hover:bg-[#0042a3] transition-colors"
            >
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value, subtitle, icon: Icon, tone = 'blue' }) {
  const toneMap = {
    blue: {
      iconBg: 'bg-blue-50 border-blue-100 text-[#0052CC]',
      value: 'text-slate-900',
    },
    emerald: {
      iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-700',
      value: 'text-emerald-700',
    },
    amber: {
      iconBg: 'bg-amber-50 border-amber-100 text-amber-700',
      value: 'text-amber-600',
    },
    slate: {
      iconBg: 'bg-slate-100 border-slate-200 text-slate-700',
      value: 'text-slate-900',
    },
  }

  const colors = toneMap[tone] || toneMap.blue
  const bgMap = {
    blue: 'bg-gradient-to-br from-white to-blue-50/60',
    emerald: 'bg-gradient-to-br from-white to-emerald-50/60',
    amber: 'bg-gradient-to-br from-white to-amber-50/60',
    slate: 'bg-gradient-to-br from-white to-slate-50/60',
  }

  const bgClass = bgMap[tone] || bgMap.blue

  return (
    <article className={`rounded-2xl border border-slate-200 ${bgClass} backdrop-blur-md p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</p>
          <p className={`mt-2 text-3xl font-black tracking-tight ${colors.value}`}>{value}</p>
        </div>
        <div className={`h-11 w-11 rounded-2xl border flex items-center justify-center ${colors.iconBg}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{subtitle}</p>
    </article>
  )
}

function SectionHeader({ title, subtitle, icon: Icon }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
          <Icon size={18} />
        </div>
      )}
    </div>
  )
}

export default function OperationsDashboard({ currentUser }) {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [draftMonth, setDraftMonth] = useState(() => new Date().getMonth())
  const [draftYear, setDraftYear] = useState(() => new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [missions, setMissions] = useState([])
  const [interventions, setInterventions] = useState([])
  const [machines, setMachines] = useState([])
  const [devis, setDevis] = useState([])

  useEffect(() => {
    let cancelled = false

    const loadAll = async () => {
      setIsLoading(true)

      const [usersRes, missionsRes, interventionsRes, machinesRes, devisRes] = await Promise.allSettled([
        apiFetch('/users', { auth: true }),
        apiFetch('/missions', { auth: true }),
        apiFetch('/interventions', { auth: true }),
        apiFetch('/machines', { auth: true }),
        apiFetch('/devis?page=1&limit=200', { auth: true }),
      ])

      if (cancelled) return

      const readArray = async (result, isPaginated = false) => {
        if (result.status !== 'fulfilled') return []
        const response = result.value
        if (!response?.ok) return []

        try {
          const payload = await response.json()
          if (isPaginated) return Array.isArray(payload?.data) ? payload.data : []
          return Array.isArray(payload) ? payload : []
        } catch {
          return []
        }
      }

      const [nextUsers, nextMissions, nextInterventions, nextMachines, nextDevis] = await Promise.all([
        readArray(usersRes),
        readArray(missionsRes),
        readArray(interventionsRes),
        readArray(machinesRes),
        readArray(devisRes, true),
      ])

      if (cancelled) return

      setUsers(nextUsers)
      setMissions(nextMissions)
      setInterventions(nextInterventions)
      setMachines(nextMachines)
      setDevis(nextDevis)
      setIsLoading(false)
    }

    void loadAll()

    return () => {
      cancelled = true
    }
  }, [])

  const yearOptions = useMemo(() => {
    const y = today.getFullYear()
    return Array.from({ length: 7 }).map((_, idx) => y - 5 + idx)
  }, [today])

  const selectedLabel = useMemo(() => {
    return `${MONTHS_FR[selectedMonth]} ${selectedYear}`
  }, [selectedMonth, selectedYear])

  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      const date = parseDateLike(m?.dueDate || m?.updatedAt || m?.createdAt)
      return isSameMonthYear(date, selectedMonth, selectedYear)
    })
  }, [missions, selectedMonth, selectedYear])

  const filteredInterventions = useMemo(() => {
    return interventions.filter((itv) => {
      const date = parseDateLike(itv?.date || itv?.interventionDate || itv?.updatedAt || itv?.createdAt)
      return isSameMonthYear(date, selectedMonth, selectedYear)
    })
  }, [interventions, selectedMonth, selectedYear])

  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      const date = parseDateLike(m?.updatedAt || m?.createdAt || m?.receptionDate)
      return isSameMonthYear(date, selectedMonth, selectedYear)
    })
  }, [machines, selectedMonth, selectedYear])

  const filteredDevis = useMemo(() => {
    return devis.filter((d) => {
      const date = parseDateLike(d?.DOCDATE || d?.DATEDOC || d?.DateDoc || d?.createdAt)
      return isSameMonthYear(date, selectedMonth, selectedYear)
    })
  }, [devis, selectedMonth, selectedYear])

  const mockDevisCounts = useMemo(() => {
    const seed = (selectedYear * 100 + (selectedMonth + 1)) % 97
    const validated = 8 + (seed % 10)
    const pending = 3 + (seed % 6)
    const notValidated = 2 + (seed % 5)
    return { validated, pending, notValidated }
  }, [selectedMonth, selectedYear])

  const devisPie = useMemo(() => {
    const hasReal = filteredDevis.length > 0
    const isMock = !hasReal && Boolean(import.meta?.env?.DEV)

    const counts = hasReal
      ? (() => {
          const validated = filteredDevis.filter((d) => !d?.IsAnnuler && (d?.ETATDOC === 'C' || d?.ETATDOC === 3)).length
          const notValidated = filteredDevis.filter((d) => Boolean(d?.IsAnnuler)).length
          const pending = Math.max(filteredDevis.length - validated - notValidated, 0)
          return { validated, pending, notValidated }
        })()
      : isMock
        ? mockDevisCounts
        : { validated: 0, pending: 0, notValidated: 0 }

    const segments = [
      {
        key: 'validated',
        label: 'Validés',
        value: counts.validated,
        color: '#10B981',
        pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      {
        key: 'pending',
        label: 'En attente',
        value: counts.pending,
        color: '#F59E0B',
        pill: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      {
        key: 'notValidated',
        label: 'Non validés',
        value: counts.notValidated,
        color: '#EF4444',
        pill: 'bg-red-50 text-red-700 border-red-200',
      },
    ]

    return { isMock, segments }
  }, [filteredDevis, mockDevisCounts])

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
      } catch {
        return false
      }
    }).length

    const devisValidated = devis.filter((d) => d?.ETATDOC === 'C' || d?.ETATDOC === 3).length
    const devisCancelled = devis.filter((d) => Boolean(d?.IsAnnuler)).length

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
      devisValidated,
      devisCancelled,
      alerts,
    }
  }, [users, machines, devis, filteredMissions, filteredInterventions])

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
      .sort((a, b) => {
        const aTs = a.date?.getTime() || 0
        const bTs = b.date?.getTime() || 0
        return bTs - aTs
      })
      .slice(0, 8)
  }, [filteredMissions, filteredInterventions, filteredMachines])

  const missionTotal = filteredMissions.length || 1
  const interventionTotal = filteredInterventions.length || 1
  const missionProgressTone = {
    'À faire': 'bg-[#0052CC]',
    'En cours': 'bg-amber-500',
    Terminée: 'bg-emerald-500',
    Bloquée: 'bg-red-500',
  }

  const interventionProgressTone = {
    PENDING: 'bg-slate-500',
    ASSIGNED: 'bg-[#0052CC]',
    IN_PROGRESS: 'bg-amber-500',
    CLOSED: 'bg-emerald-500',
  }

  const missionStatusRows = useMemo(() => {
    return missionStatuses.map((status) => {
      const count = analytics.missionCounts[status] || 0
      return {
        key: status,
        label: missionStatusLabel[status],
        count,
        pct: (count / missionTotal) * 100,
        tone: missionProgressTone[status] || 'bg-slate-700',
      }
    })
  }, [analytics.missionCounts, missionTotal])

  const interventionStatusRows = useMemo(() => {
    return interventionStatuses.map((status) => {
      const count = analytics.interventionCounts[status] || 0
      return {
        key: status,
        label: interventionStatusLabel[status],
        count,
        pct: (count / interventionTotal) * 100,
        tone: interventionProgressTone[status] || 'bg-slate-700',
      }
    })
  }, [analytics.interventionCounts, interventionTotal])

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
      key: row.key,
      label: row.label,
      value: row.value,
      color: palette[idx] || '#2563EB',
    }))
  }, [closedMissionsByEmployee])

  const quickActions = useMemo(() => {
    return [
      {
        label: 'Affecter mission',
        hint: 'Planifier une intervention terrain',
        to: '/missions/assign',
        icon: Send,
      },
      {
        label: 'Nouveau dossier SAV',
        hint: 'Créer une intervention immédiatement',
        to: '/interventions/create',
        icon: PlusCircle,
      },
      {
        label: 'Créer un devis',
        hint: 'Lancer un devis commercial',
        to: '/devis/create',
        icon: FileText,
      },
      {
        label: 'Ajouter utilisateur',
        hint: 'Administrer les accès équipe',
        to: '/users',
        icon: UserPlus,
      },
    ]
  }, [])

  const activityKindMeta = {
    mission: {
      label: 'Mission',
      tone: 'text-blue-700 bg-blue-50 border-blue-100',
      dot: 'bg-[#0052CC]',
      ring: 'ring-blue-100/70',
    },
    intervention: {
      label: 'Intervention',
      tone: 'text-amber-700 bg-amber-50 border-amber-100',
      dot: 'bg-amber-500',
      ring: 'ring-amber-100/70',
    },
    machine: {
      label: 'Machine',
      tone: 'text-slate-700 bg-slate-100 border-slate-200',
      dot: 'bg-slate-500',
      ring: 'ring-slate-200/70',
    },
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 right-0 w-[42rem] h-[42rem] bg-blue-200/35 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-6rem] w-[36rem] h-[36rem] bg-cyan-200/25 rounded-full blur-3xl" />
        <div className="absolute top-[30%] left-[45%] w-[28rem] h-[28rem] bg-indigo-200/20 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-0 sm:h-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-[#0052CC] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">
                  Tableau de bord opérationnel
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#0052CC]">
                  <Sparkles size={12} />
                  Pilotage
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  {currentUser?.name || currentUser?.username || 'Utilisateur'}
                </span>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  MAJ {today.toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setDraftMonth(selectedMonth)
                setDraftYear(selectedYear)
                setMonthPickerOpen(true)
              }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-black max-w-full"
            >
              <CalendarDays size={16} /> Mois
              <span className="hidden sm:inline text-slate-500 font-semibold">
                {selectedLabel}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <MonthYearModal
          open={monthPickerOpen}
          month={draftMonth}
          year={draftYear}
          yearOptions={yearOptions}
          onChangeMonth={setDraftMonth}
          onChangeYear={setDraftYear}
          onClose={() => setMonthPickerOpen(false)}
          onApply={() => {
            setSelectedMonth(draftMonth)
            setSelectedYear(draftYear)
            setMonthPickerOpen(false)
          }}
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Missions ouvertes"
            value={analytics.missionOpen}
            subtitle={`${analytics.missionCounts['En cours']} en cours et ${analytics.missionCounts.Bloquée} bloquées — ${selectedLabel}`}
            icon={ClipboardList}
            tone="blue"
          />
          <KpiCard
            title="Interventions actives"
            value={analytics.interventionOpen}
            subtitle={`${analytics.highPriorityInterventions} en priorité haute/critique — ${selectedLabel}`}
            icon={Wrench}
            tone="amber"
          />
          <KpiCard
            title="Utilisateurs actifs"
            value={analytics.activeUsers}
            subtitle={`${users.length} comptes utilisateurs au total`}
            icon={UserRound}
            tone="emerald"
          />
          <KpiCard
            title="Devis validés"
            value={filteredDevis.filter((d) => d?.ETATDOC === 'C' || d?.ETATDOC === 3).length}
            subtitle={`${filteredDevis.filter((d) => Boolean(d?.IsAnnuler)).length} devis annulés — ${selectedLabel}`}
            icon={CheckCircle2}
            tone="slate"
          />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <article className="xl:col-span-8 min-w-0 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-blue-50/60 backdrop-blur-md p-5 shadow-sm">
            <SectionHeader
              title="Performance équipe"
              subtitle={`Missions clôturées — ${selectedLabel}`}
              icon={Users}
            />

            {employeeComparisonChart.length === 0 && !isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Aucune mission clôturée sur la période sélectionnée.
              </div>
            ) : (
              <>
                <div className="mt-5 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top clôture</p>
                          <p className="mt-2 text-lg font-black text-slate-900 truncate">
                            {topCloser?.label || '—'}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {topCloser ? `${topCloser.value} mission(s) clôturée(s)` : '—'}
                          </p>
                        </div>
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                          <Trophy size={18} />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total clôturées</p>
                          <p className="mt-2 text-2xl font-black text-slate-900">
                            {closedMissionsByEmployee.reduce((sum, r) => sum + (Number(r.value) || 0), 0)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">Sur la période</p>
                        </div>
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center border border-blue-100">
                          <CheckCircle2 size={18} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <BarChart items={employeeComparisonChart} height={180} />
                </div>
              </>
            )}
          </article>
          <article className="xl:col-span-4 min-w-0 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 backdrop-blur-md p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Devis</h2>
                <p className="mt-1 text-sm text-slate-500 truncate">{`Camembert — ${selectedLabel}`}</p>
              </div>
              <div className="flex items-center gap-2">
                {devisPie.isMock && (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Mock
                  </span>
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                  <FileText size={18} />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 place-items-center">
              <DonutChart segments={devisPie.segments} size={190} thickness={18} />
              <div className="w-full space-y-2">
                {devisPie.segments.map((seg) => (
                  <div key={seg.key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
                      <span className="text-xs font-bold text-slate-800 truncate">{seg.label}</span>
                      <span className={`ml-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${seg.pill}`}>
                        {seg.value}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      {devisPie.segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0) > 0
                        ? `${Math.round(((Number(seg.value) || 0) / devisPie.segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0)) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <article className="xl:col-span-4 min-w-0 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-emerald-50/60 backdrop-blur-md p-5 shadow-sm">
            <SectionHeader
              title="Missions"
              subtitle={`Statuts — ${selectedLabel}`}
              icon={ClipboardList}
            />

            <div className="space-y-3">
              {missionStatusRows.map((row) => (
                <div key={row.key} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{row.label}</span>
                    <span className="font-black text-slate-900">{row.count}</span>
                  </div>
                  <ProgressBar value={row.pct} tone={row.tone} />
                </div>
              ))}
            </div>
          </article>

          <article className="xl:col-span-4 min-w-0 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-amber-50/60 backdrop-blur-md p-5 shadow-sm">
            <SectionHeader
              title="Interventions"
              subtitle={`Statuts — ${selectedLabel}`}
              icon={Wrench}
            />

            <div className="space-y-3">
              {interventionStatusRows.map((row) => (
                <div key={row.key} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{row.label}</span>
                    <span className="font-black text-slate-900">{row.count}</span>
                  </div>
                  <ProgressBar value={row.pct} tone={row.tone} />
                </div>
              ))}
            </div>
          </article>

          <article className="xl:col-span-4 min-w-0 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-cyan-50/60 backdrop-blur-md p-5 shadow-sm">
            <SectionHeader
              title="Machines"
              subtitle="Documentation disponible"
              icon={Layers}
            />

            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="inline-flex items-center gap-1 font-black uppercase tracking-[0.14em] text-[#0052CC]">
                  <Layers size={14} />
                  Parc documenté
                </span>
                <span className="font-semibold text-slate-600">
                  {analytics.machinesWithDocs} / {machines.length} — {docPct}%
                </span>
              </div>
              <ProgressBar value={docPct} tone="bg-[#0052CC]" />
              <p className="mt-3 text-xs font-medium text-slate-500">
                Indique la part de machines avec au moins un document PDF associé.
              </p>
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <article className="xl:col-span-8 min-w-0 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 backdrop-blur-md p-5 shadow-sm" style={{ backgroundColor: 'antiquewhite' }}>
            <SectionHeader
              title="Activité récente"
              subtitle={`Derniers événements métiers — ${selectedLabel}`}
              icon={Activity}
            />

            <div
              className="space-y-3 max-h-[60vh] sm:max-h-[420px] overflow-y-auto overflow-x-hidden pr-1 scrollbar-gray"
              style={{ maxHeight: 575 }}
            >
              {recentActivity.length === 0 && !isLoading && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Aucune activité récente disponible.
                </div>
              )}

              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 p-4 animate-pulse">
                    <div className="h-3 w-2/3 bg-slate-100 rounded" />
                    <div className="mt-2 h-2 w-1/2 bg-slate-100 rounded" />
                  </div>
                ))}

              {!isLoading &&
                recentActivity.map((item) => (
                  <div key={item.id} className="group rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-slate-50/60 p-4 hover:border-blue-200 hover:shadow-sm transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ${activityKindMeta[item.kind]?.ring || 'ring-slate-200/70'} ${activityKindMeta[item.kind]?.dot || 'bg-slate-400'}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 leading-snug truncate">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-500 truncate">{item.meta}</p>
                          </div>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusTone[item.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {missionStatusLabel[item.status] || interventionStatusLabel[item.status] || item.status}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 size={12} />
                            {relativeDateLabel(item.rawDate)}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-semibold ${activityKindMeta[item.kind]?.tone || 'text-slate-600 bg-slate-100 border-slate-200'}`}>
                            {activityKindMeta[item.kind]?.label || item.kind}
                            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </article>

          <article className="xl:col-span-4 min-w-0 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-blue-50/60 backdrop-blur-md p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Actions rapides</h2>
                <p className="mt-1 text-sm text-slate-500">Raccourcis pour exécuter les tâches opérationnelles les plus fréquentes</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center border border-blue-100">
                <ArrowUpRight size={18} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => navigate(action.to)}
                    className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center border border-blue-100">
                        <Icon size={18} />
                      </div>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-[#0052CC] transition-colors" />
                    </div>
                    <p className="mt-4 text-sm font-bold text-slate-900">{action.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{action.hint}</p>
                  </button>
                )
              })}
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {analytics.alerts.map((alert) => {
            const severityTone =
              alert.severity === 'high'
                ? 'border-rose-200 bg-rose-50/70 text-rose-700'
                : alert.severity === 'medium'
                  ? 'border-amber-200 bg-amber-50/70 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50/70 text-emerald-700'

            return (
              <article key={alert.title} className={`rounded-2xl border p-5 ${severityTone} transition-transform hover:-translate-y-0.5`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest opacity-80">Alerte opérationnelle</p>
                    <h3 className="mt-2 text-sm font-bold leading-snug">{alert.title}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-white/70 border border-white flex items-center justify-center">
                    <AlertTriangle size={18} />
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-3xl font-black tracking-tight">{alert.value}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider opacity-80">
                    <HardDrive size={12} />
                    Surveillance
                  </span>
                </div>
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}
