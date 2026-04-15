import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  History,
  Settings,
  Loader2,
  AlertCircle,
  Zap,
  CalendarDays,
  Wrench,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  PieChart,
} from 'lucide-react'
import { apiFetch } from '../../api/apiClient'

function normalizeRole(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getStoredUser() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem('auth_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const PRIORITY_ORDER = { Critique: 1, Haute: 2, Moyenne: 3, Basse: 4 }

const MONTHS_FR = {
  janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
}

function parseDueDate(str) {
  if (!str) return null
  const lower = String(str).toLowerCase().trim()
  if (lower === "aujourd'hui" || lower === 'aujourd\'hui') return new Date()
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) {
    const [y, m, d] = lower.split('-').map((n) => parseInt(n, 10))
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) return new Date(y, m - 1, d)
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(lower)) {
    const [dd, mm, yyyy] = lower.split('/').map((n) => parseInt(n, 10))
    if (!Number.isNaN(dd) && !Number.isNaN(mm) && !Number.isNaN(yyyy)) return new Date(yyyy, mm - 1, dd)
  }
  const parts = lower.split(' ')
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10)
    const month = MONTHS_FR[parts[1]]
    const year = parseInt(parts[2], 10)
    if (!Number.isNaN(day) && month !== undefined && !Number.isNaN(year)) return new Date(year, month, day)
  }
  return null
}

function synchronizeGroupedMissionStatuses(rows) {
  const missions = Array.isArray(rows) ? rows : []
  const statusByGroup = new Map()

  for (const mission of missions) {
    const groupId = String(mission?.assignmentGroupId || '').trim()
    if (!groupId || statusByGroup.has(groupId)) continue
    statusByGroup.set(groupId, mission?.status || 'À faire')
  }

  return missions.map((mission) => {
    const groupId = String(mission?.assignmentGroupId || '').trim()
    const groupStatus = groupId ? statusByGroup.get(groupId) : null
    return groupStatus ? { ...mission, status: groupStatus } : mission
  })
}

function StatusPill({ status }) {
  const cfg =
    status === 'Terminée'
      ? { Icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      : status === 'En cours'
        ? { Icon: Loader2, cls: 'bg-amber-50 text-amber-700 border-amber-200' }
        : status === 'Bloquée'
          ? { Icon: XCircle, cls: 'bg-red-50 text-red-700 border-red-200' }
          : { Icon: Clock, cls: 'bg-blue-50 text-blue-700 border-blue-200' }

  const Icon = cfg.Icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${cfg.cls}`}>
      <Icon size={12} className={status === 'En cours' ? 'animate-spin' : ''} />
      {status || 'À faire'}
    </span>
  )
}

function formatShortDate(date) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  } catch {
    return String(date)
  }
}

function clampNumber(value, min, max) {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

function DonutChart({ segments, size = 140, thickness = 16 }) {
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
          const dash = clampNumber(portion * c, 0, c)
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
        <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">Total</p>
      </div>
    </div>
  )
}

function BarChart({ items, height = 120 }) {
  const safeItems = Array.isArray(items) ? items : []
  const max = Math.max(1, ...safeItems.map((it) => Number(it.value) || 0))

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {safeItems.map((it) => {
        const v = Number(it.value) || 0
        const h = `${clampNumber((v / max) * 100, 0, 100)}%`
        return (
          <div key={it.key || it.label} className="flex-1 min-w-0">
            <div className="w-full rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
              <div className="w-full flex items-end justify-center" style={{ height }}>
                <div className="w-full px-2 pb-2 flex items-end">
                  <div className="w-full rounded-lg" style={{ height: h, background: it.color }} />
                </div>
              </div>
            </div>
            <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">{it.label}</p>
            <p className="mt-0.5 text-sm font-black text-slate-900">{v}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardTechnicien({ currentUser }) {
  const navigate = useNavigate()
  const fallbackUser = useMemo(() => getStoredUser(), [])
  const user = currentUser || fallbackUser
  const normalizedRole = normalizeRole(user?.role)
  const isTechnicien = normalizedRole === 'technicien'

  const [missions, setMissions] = useState([])
  const [interventions, setInterventions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isTechnicien) return
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      apiFetch('/missions', { auth: true, cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
      apiFetch('/interventions', { auth: true, cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([missionsRaw, interventionsRaw]) => {
        if (cancelled) return
        const missionsRows = synchronizeGroupedMissionStatuses(Array.isArray(missionsRaw) ? missionsRaw : [])
        const interventionsRows = Array.isArray(interventionsRaw) ? interventionsRaw : []

        const myMissions = (() => {
          if (!user) return missionsRows
          const id = user?.id != null ? Number(user.id) : null
          const name = String(user?.name || user?.username || '').trim()
          if (id != null && !Number.isNaN(id)) return missionsRows.filter((m) => Number(m.employeeUserId) === id)
          if (name) return missionsRows.filter((m) => String(m.employee || '').trim() === name)
          return missionsRows
        })()

        const myInterventions = (() => {
          if (!user) return interventionsRows
          const name = String(user?.name || user?.username || '').trim()
          if (!name) return interventionsRows
          return interventionsRows.filter((row) => {
            const assigned =
              row?.assignedEmployeesDisplay ||
              row?.technicianName ||
              row?.assignedTo ||
              row?.assignee ||
              row?.technician ||
              ''
            return String(assigned || '').includes(name)
          })
        })()

        setMissions(myMissions)
        setInterventions(myInterventions)
      })
      .catch(() => {
        if (cancelled) return
        setError('Impossible de charger les données du tableau de bord.')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isTechnicien, user])

  const missionStats = useMemo(() => {
    const total = missions.length
    const todo = missions.filter((m) => m.status === 'À faire').length
    const inProgress = missions.filter((m) => m.status === 'En cours').length
    const done = missions.filter((m) => m.status === 'Terminée').length
    const blocked = missions.filter((m) => m.status === 'Bloquée').length
    return { total, todo, inProgress, done, blocked }
  }, [missions])

  const urgentMission = useMemo(() => {
    return missions
      .filter((m) => m.status !== 'Terminée' && (m.priority === 'Critique' || m.priority === 'Haute'))
      .sort((a, b) => (PRIORITY_ORDER[a.priority] || 9) - (PRIORITY_ORDER[b.priority] || 9))[0] || null
  }, [missions])

  const upcomingMissions = useMemo(() => {
    return missions
      .filter((m) => m.status !== 'Terminée')
      .map((m) => ({ ...m, _due: parseDueDate(m.dueDate) }))
      .sort((a, b) => {
        if (a._due && b._due) return a._due.getTime() - b._due.getTime()
        if (a._due) return -1
        if (b._due) return 1
        return (Number(a?.id) || 0) - (Number(b?.id) || 0)
      })
      .slice(0, 6)
  }, [missions])

  const interventionStats = useMemo(() => {
    const total = interventions.length
    const closed = interventions.filter((i) => String(i?.status || '').trim().toUpperCase() === 'CLOSED').length
    const open = total - closed
    return { total, open, closed }
  }, [interventions])

  const recentInterventions = useMemo(() => {
    return interventions
      .map((row) => {
        const date = row?.interventionDate || row?.date || ''
        const parsed = parseDueDate(date) || (date ? new Date(date) : null)
        return { ...row, _date: parsed }
      })
      .sort((a, b) => {
        if (a._date && b._date) return b._date.getTime() - a._date.getTime()
        if (a._date) return -1
        if (b._date) return 1
        return (Number(b?.id) || 0) - (Number(a?.id) || 0)
      })
      .slice(0, 6)
  }, [interventions])

  const missionChartSegments = useMemo(() => {
    return [
      { key: 'todo', label: 'À faire', value: missionStats.todo, color: '#2563EB' },
      { key: 'inprogress', label: 'En cours', value: missionStats.inProgress, color: '#F59E0B' },
      { key: 'blocked', label: 'Bloquées', value: missionStats.blocked, color: '#EF4444' },
      { key: 'done', label: 'Terminées', value: missionStats.done, color: '#10B981' },
    ].filter((s) => (Number(s.value) || 0) > 0)
  }, [missionStats])

  const missionsByNext7Days = useMemo(() => {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short' })
      return { date: d, label, value: 0 }
    })

    missions
      .filter((m) => m.status !== 'Terminée')
      .forEach((m) => {
        const d = parseDueDate(m.dueDate)
        if (!d) return
        const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
        const idx = buckets.findIndex((b) => b.date.getTime() === key)
        if (idx >= 0) buckets[idx].value += 1
      })

    return buckets.map((b) => ({
      key: b.label,
      label: b.label,
      value: b.value,
      color: b.value > 0 ? '#2563EB' : '#CBD5E1',
    }))
  }, [missions])

  if (!isTechnicien) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-lg w-full text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle size={22} />
          </div>
          <p className="mt-4 font-black text-slate-900">Accès refusé</p>
          <p className="mt-1 text-sm text-slate-500">Ce tableau de bord est réservé aux techniciens.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-5 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#0052CC] text-white text-xs font-black"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-32 right-0 w-[42rem] h-[42rem] bg-blue-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-6rem] w-[36rem] h-[36rem] bg-cyan-200/30 rounded-full blur-3xl" />
        <div className="absolute top-[30%] left-[45%] w-[28rem] h-[28rem] bg-indigo-200/20 rounded-full blur-3xl" />
      </div>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#0052CC] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Tableau de bord</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  Technicien
                </span>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {String(user?.name || user?.username || '—')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/missions/my')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-black"
            >
              <ClipboardList size={16} /> Mes missions
            </button>
            <button
              onClick={() => navigate(`/employees/${user?.id || 'me'}/history`)}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-black"
            >
              <History size={16} /> Historique
            </button>
            <button
              onClick={() => navigate('/machines')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0052CC] text-white text-xs font-black shadow-lg shadow-blue-200 hover:bg-[#0042a3] transition-colors"
            >
              <Settings size={16} /> Parc Machines
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-2xl p-8 flex items-center gap-3 text-red-700">
            <AlertCircle size={18} />
            <p className="font-semibold">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Missions</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{missionStats.total}</p>
                <p className="mt-1 text-xs text-slate-500 font-semibold">Total assignées</p>
              </div>
              <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">En cours</p>
                <p className="mt-2 text-3xl font-black text-amber-600">{missionStats.inProgress}</p>
                <p className="mt-1 text-xs text-slate-500 font-semibold">À traiter</p>
              </div>
              <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Bloquées</p>
                <p className="mt-2 text-3xl font-black text-red-600">{missionStats.blocked}</p>
                <p className="mt-1 text-xs text-slate-500 font-semibold">Nécessitent attention</p>
              </div>
              <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Interventions</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{interventionStats.open}</p>
                <p className="mt-1 text-xs text-slate-500 font-semibold">{interventionStats.closed} clôturées</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-8 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-white to-slate-50">
                  <div className="flex items-center gap-2">
                    <PieChart size={18} className="text-slate-500" />
                    <p className="text-sm font-black text-slate-900">Répartition des statuts</p>
                  </div>
                  <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full uppercase tracking-wider">
                    Missions
                  </span>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="flex items-center justify-center">
                    <DonutChart segments={missionChartSegments} />
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'À faire', value: missionStats.todo, color: '#2563EB' },
                      { label: 'En cours', value: missionStats.inProgress, color: '#F59E0B' },
                      { label: 'Bloquées', value: missionStats.blocked, color: '#EF4444' },
                      { label: 'Terminées', value: missionStats.done, color: '#10B981' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
                          <p className="text-sm font-bold text-slate-700 truncate">{row.label}</p>
                        </div>
                        <p className="text-sm font-black text-slate-900">{row.value}</p>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Prochains 7 jours</p>
                      <div className="mt-3">
                        <BarChart items={missionsByNext7Days} height={92} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-4 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-slate-500" />
                    <p className="text-sm font-black text-slate-900">Focus du jour</p>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full uppercase tracking-wider">
                    {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  {urgentMission ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/missions/${urgentMission.id}`)}
                      className="w-full rounded-2xl border border-red-200 bg-red-50 p-4 text-left hover:shadow-sm transition-all"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Mission prioritaire</p>
                      <p className="mt-1 text-sm font-black text-slate-900 truncate">{urgentMission.title || `Mission #${urgentMission.id}`}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <StatusPill status={urgentMission.status} />
                        <span className="text-xs font-bold text-slate-600">{urgentMission.dueDate || '—'}</span>
                      </div>
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priorité</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">Aucune mission critique/haute en attente</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/missions/my')}
                      className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">En cours</p>
                      <p className="mt-1 text-2xl font-black text-amber-600">{missionStats.inProgress}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Voir mes missions</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/missions/my')}
                      className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bloquées</p>
                      <p className="mt-1 text-2xl font-black text-red-600">{missionStats.blocked}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Détails</p>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/employees/${user?.id || 'me'}/history`)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interventions</p>
                        <p className="mt-1 text-sm font-bold text-slate-700">{interventionStats.open} ouvertes • {interventionStats.closed} clôturées</p>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 shrink-0" />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {urgentMission && (
              <button
                type="button"
                onClick={() => navigate(`/missions/${urgentMission.id}`)}
                className="w-full bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm transition-all text-left"
              >
                <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Zap size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-red-600 uppercase tracking-widest">Mission prioritaire</p>
                  <p className="mt-1 font-black text-slate-900 truncate">{urgentMission.title || `Mission #${urgentMission.id}`}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusPill status={urgentMission.status} />
                    {urgentMission.dueDate && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-red-200 bg-white text-red-700">
                        <CalendarDays size={12} />
                        {urgentMission.dueDate}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-red-300 shrink-0" />
              </button>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={18} className="text-slate-500" />
                    <p className="text-sm font-black text-slate-900">Missions à venir</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/missions/my')}
                    className="text-xs font-black text-[#0052CC] hover:underline"
                  >
                    Voir tout
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  {upcomingMissions.length === 0 ? (
                    <p className="text-sm text-slate-500 font-medium px-2 py-6 text-center">Aucune mission en cours.</p>
                  ) : (
                    upcomingMissions.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => navigate(`/missions/${m.id}`)}
                        className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{m.title || `Mission #${m.id}`}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              {m.dueDate && <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{m.dueDate}</span>}
                              {m.site && <span className="truncate">{m.site}</span>}
                            </div>
                          </div>
                          <StatusPill status={m.status} />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench size={18} className="text-slate-500" />
                    <p className="text-sm font-black text-slate-900">Interventions récentes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/employees/${user?.id || 'me'}/history`)}
                    className="text-xs font-black text-[#0052CC] hover:underline"
                  >
                    Voir l'historique
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  {recentInterventions.length === 0 ? (
                    <p className="text-sm text-slate-500 font-medium px-2 py-6 text-center">Aucune intervention trouvée.</p>
                  ) : (
                    recentInterventions.map((itv) => {
                      const status = String(itv?.status || '').trim().toUpperCase()
                      const badge =
                        status === 'CLOSED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'

                      return (
                        <button
                          key={itv.id}
                          type="button"
                          onClick={() => navigate(`/interventions/${itv.id}`)}
                          className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate">
                                Intervention #{itv.id}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                {(itv.clientName || itv.client) && (
                                  <span className="truncate">{itv.clientName || itv.client}</span>
                                )}
                                {(itv.interventionDate || itv.date) && (
                                  <span className="truncate">{formatShortDate(itv.interventionDate || itv.date)}</span>
                                )}
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge}`}>
                              {status || 'OPEN'}
                            </span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

