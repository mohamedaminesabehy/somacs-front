import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Plus, Search, Download,
  Calendar, Clock, CheckCircle2, AlertCircle, Layers,
  ArrowUpRight, Wrench, ClipboardList, RefreshCw,
  X, TrendingUp,
} from 'lucide-react'
import MissionTable from '../../components/mission/MissionTable'
import { apiFetch } from '../../api/apiClient'

const accentMap = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-100',    icon: 'bg-blue-100 text-blue-600',     value: 'text-blue-700',    delta: 'text-blue-500',    bar: 'bg-blue-500'    },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-100',   icon: 'bg-amber-100 text-amber-600',   value: 'text-amber-700',   delta: 'text-amber-500',   bar: 'bg-amber-500'   },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'bg-emerald-100 text-emerald-600',value: 'text-emerald-700', delta: 'text-emerald-500', bar: 'bg-emerald-500' },
  red:     { bg: 'bg-red-50',     border: 'border-red-100',     icon: 'bg-red-100 text-red-600',       value: 'text-red-700',     delta: 'text-red-500',     bar: 'bg-red-500'     },
}

// ── KPI Card component ────────────────────────────────────────────────────────
function KpiCard({ kpi }) {
  const a = accentMap[kpi.accent]
  const Icon = kpi.icon
  return (
    <div className={`relative flex flex-col gap-2 sm:gap-3 rounded-2xl border ${a.border} ${a.bg} p-3 sm:p-5 overflow-hidden group hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-start justify-between">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${a.icon}`}>
          <Icon size={18} />
        </div>
        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
      </div>
      <div>
        <p className={`text-2xl sm:text-3xl font-black tracking-tight ${a.value}`}>{kpi.value}</p>
        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5">{kpi.label}</p>
      </div>
      <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold ${a.delta}`}>
        {kpi.deltaUp === true  && <TrendingUp size={12} />}
        {kpi.deltaUp === false && <AlertCircle size={12} />}
        <span>{kpi.delta}</span>
        <span className="font-normal text-slate-400">{kpi.deltaLabel}</span>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${a.bar} opacity-40 rounded-b-2xl`} />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ListMission() {
  const navigate = useNavigate()
  const location = useLocation()
  const tableRef = useRef(null)
  const toastTimerRef = useRef(null)

  const [missions, setMissions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '' })

  const [search, setSearch]                 = useState('')
  const [filterEmployee, setFilterEmployee] = useState('all')
  const [filterStatus, setFilterStatus]     = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterType, setFilterType]         = useState('all')
  const [dateMode, setDateMode]             = useState('range')
  const [startDate, setStartDate]           = useState('')
  const [endDate, setEndDate]               = useState('')
  const [activeTab, setActiveTab]           = useState('all')

  const refreshMissions = async () => {
    setIsLoading(true)
    try {
        const response = await apiFetch('/missions', { auth: true })
      if (!response.ok) return
      const data = await response.json()
      setMissions(Array.isArray(data) ? data : [])
    } catch {
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshMissions()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const toastKey = params.get('toast') || location.state?.toast || ''
    if (!toastKey) return

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }

    if (toastKey === 'assigned') {
      setToast({ open: true, message: 'Mission affectée avec succès.' })
      toastTimerRef.current = window.setTimeout(() => {
        setToast({ open: false, message: '' })
        toastTimerRef.current = null
      }, 3000)
    }

    if (location.search || location.state?.toast) {
      navigate({ pathname: location.pathname, search: '' }, { replace: true, state: {} })
    }

    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
  }, [location.pathname, location.search, location.state, navigate])

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const parseMissionDate = (mission) => {
    const raw = mission?.dueDate
    if (!raw) return null
    const s = String(raw).trim()
    if (!s) return null
    if (s === "Aujourd'hui" || s === "AUJOURD'HUI" || s.toLowerCase() === "aujourd'hui") {
      return new Date()
    }
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return missions.filter((m) => {
      if (filterType !== 'all' && m.type !== filterType) return false
      if (filterEmployee !== 'all' && m.employee !== filterEmployee) return false
      if (filterPriority !== 'all' && m.priority !== filterPriority) return false

      if (dateMode === 'today') {
        const d = parseMissionDate(m)
        const key = d ? d.toISOString().slice(0, 10) : ''
        if (key !== todayKey) return false
      } else {
        if (startDate || endDate) {
          const d = parseMissionDate(m)
          if (!d) return false
          const key = d.toISOString().slice(0, 10)
          if (startDate && key < startDate) return false
          if (endDate && key > endDate) return false
        }
      }

      if (q) {
        const hay = [
          m.title,
          m.description,
          m.employee,
          m.site,
          m.address,
          m.interventionId,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }

      return true
    })
  }, [missions, search, filterType, filterEmployee, filterPriority, dateMode, startDate, endDate, todayKey])

  const statusTabs = useMemo(() => {
    const countFor = (status) => baseFiltered.filter((m) => m.status === status).length
    return [
      { key: 'all', label: 'Toutes', count: baseFiltered.length },
      { key: 'À faire', label: 'À faire', count: countFor('À faire') },
      { key: 'En cours', label: 'En cours', count: countFor('En cours') },
      { key: 'Terminée', label: 'Terminées', count: countFor('Terminée') },
      { key: 'Bloquée', label: 'Bloquées', count: countFor('Bloquée') },
    ]
  }, [baseFiltered])

  const visibleMissions = useMemo(() => {
    return baseFiltered.filter((m) => {
      if (filterStatus !== 'all' && m.status !== filterStatus) return false
      return true
    })
  }, [baseFiltered, filterStatus])

  const employeeOptions = useMemo(() => {
    return Array.from(new Set(missions.map((m) => m.employee).filter(Boolean))).sort()
  }, [missions])

  const interventionsLinkedCount = useMemo(() => {
    return missions.filter((m) => m.type === 'Intervention' && m.interventionId).length
  }, [missions])

  const kpis = useMemo(() => {
    const all = missions
    const todayCount = all.filter((m) => {
      const d = parseMissionDate(m)
      return d ? d.toISOString().slice(0, 10) === todayKey : false
    }).length

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yKey = yesterday.toISOString().slice(0, 10)
    const yesterdayCount = all.filter((m) => {
      const d = parseMissionDate(m)
      return d ? d.toISOString().slice(0, 10) === yKey : false
    }).length
    const todayDelta = todayCount - yesterdayCount

    const inProgress = all.filter((m) => m.status === 'En cours')
    const prioritized = inProgress.filter((m) => m.priority === 'Critique' || m.priority === 'Haute').length

    const doneAll = all.filter((m) => m.status === 'Terminée').length
    const now = new Date()
    const day = now.getDay()
    const mondayOffset = day === 0 ? 6 : day - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - mondayOffset)
    weekStart.setHours(0, 0, 0, 0)
    const prevWeekStart = new Date(weekStart)
    prevWeekStart.setDate(weekStart.getDate() - 7)
    const prevWeekEnd = new Date(weekStart)

    const doneThisWeek = all.filter((m) => {
      if (m.status !== 'Terminée') return false
      const d = parseMissionDate(m)
      if (!d) return false
      return d >= weekStart
    }).length

    const donePrevWeek = all.filter((m) => {
      if (m.status !== 'Terminée') return false
      const d = parseMissionDate(m)
      if (!d) return false
      return d >= prevWeekStart && d < prevWeekEnd
    }).length

    const doneDelta = doneThisWeek - donePrevWeek
    const blocked = all.filter((m) => m.status === 'Bloquée').length

    return [
      {
        key: 'today',
        label: 'Missions du jour',
        value: todayCount,
        delta: `${todayDelta >= 0 ? '+' : ''}${todayDelta}`,
        deltaLabel: 'depuis hier',
        deltaUp: todayDelta > 0 ? true : todayDelta < 0 ? false : null,
        icon: Calendar,
        accent: 'blue',
      },
      {
        key: 'inprogress',
        label: 'En cours',
        value: inProgress.length,
        delta: String(prioritized),
        deltaLabel: 'prioritaires',
        deltaUp: null,
        icon: Clock,
        accent: 'amber',
      },
      {
        key: 'done',
        label: 'Terminées',
        value: doneAll,
        delta: `${doneDelta >= 0 ? '+' : ''}${doneDelta}`,
        deltaLabel: 'cette semaine',
        deltaUp: doneDelta > 0 ? true : doneDelta < 0 ? false : null,
        icon: CheckCircle2,
        accent: 'emerald',
      },
      {
        key: 'blocked',
        label: 'Bloquées',
        value: blocked,
        delta: blocked > 0 ? '!' : '—',
        deltaLabel: 'Attention requise',
        deltaUp: blocked > 0 ? false : null,
        icon: AlertCircle,
        accent: 'red',
      },
    ]
  }, [missions, todayKey])

  const hasActiveFilters =
    search !== '' ||
    filterEmployee !== 'all' ||
    filterStatus !== 'all' ||
    filterPriority !== 'all' ||
    filterType !== 'all' ||
    (dateMode === 'range' && (startDate !== '' || endDate !== ''))

  const resetFilters = () => {
    setSearch('')
    setFilterEmployee('all')
    setFilterStatus('all')
    setFilterPriority('all')
    setFilterType('all')
    setDateMode('range')
    setStartDate('')
    setEndDate('')
    setActiveTab('all')
  }

  return (
    <div className="min-h-full bg-slate-50">
      {toast.open && (
        <div className="fixed top-5 right-5 sm:top-6 sm:right-6 z-[120] animate-in fade-in duration-200">
          <div
            role="status"
            className="w-[320px] sm:w-[360px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex items-start gap-3.5 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Missions</p>
                <p className="text-sm font-semibold text-slate-800 leading-snug mt-0.5 break-words">{toast.message}</p>
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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-[#0052CC] flex items-center justify-center shadow-lg shadow-blue-200">
                <Layers size={18} className="text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Gestion des missions</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium ml-12 hidden sm:block">
              Suivez, assignez et pilotez toutes les missions de votre équipe SAV.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-semibold shadow-sm active:scale-95">
              <Download size={16} />
              <span className="hidden sm:inline">Exporter</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/missions/assign')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] hover:bg-[#003fa3] text-white rounded-xl text-sm font-black shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={2.5} />
              Affecter une mission
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((kpi) => <KpiCard key={kpi.key} kpi={kpi} />)}
        </div>

        {/* ── Main table card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Title */}
              <div className="flex items-center gap-3">
                <ClipboardList size={18} className="text-[#0052CC]" />
                <h2 className="text-base font-black text-slate-900 tracking-tight">Toutes les missions</h2>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-[#0052CC] text-xs font-black">
                  {visibleMissions.length}
                </span>
              </div>

              {/* Search + filter toggle */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative flex-1 sm:flex-none sm:w-64">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher une mission…"
                    className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 focus:border-[#0052CC] bg-slate-50 hover:bg-white transition-all"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-red-600 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                  >
                    <RefreshCw size={13} />
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            {/* Expandable advanced filters */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employé</label>
                <select
                  value={filterEmployee}
                  onChange={(e) => setFilterEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 bg-white"
                >
                  <option value="all">Tous les employés</option>
                  {employeeOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statut</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value)
                    setActiveTab(e.target.value === 'all' ? 'all' : e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 bg-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="À faire">À faire</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminée">Terminée</option>
                  <option value="Bloquée">Bloquée</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priorité</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 bg-white"
                >
                  <option value="all">Toutes priorités</option>
                  <option value="Critique">Critique</option>
                  <option value="Haute">Haute</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Basse">Basse</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type de mission</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 bg-white"
                >
                  <option value="all">Tous les types</option>
                  <option value="Normal">Normal</option>
                  <option value="Intervention">Intervention S.A.V</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date mission</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDateMode('today')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                      dateMode === 'today'
                        ? 'bg-[#0052CC] text-white border-[#0052CC]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    Aujourd&apos;hui
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateMode('range')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                      dateMode === 'range'
                        ? 'bg-[#0052CC] text-white border-[#0052CC]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    Intervalle
                  </button>
                </div>
                {dateMode === 'range' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 bg-white"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Quick status tabs + SAV badge */}
            <div className="flex items-center gap-1 mt-4 overflow-x-auto no-scrollbar">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key)
                    setFilterStatus(tab.key === 'all' ? 'all' : tab.key)
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? 'bg-[#0052CC] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#0052CC] text-xs font-bold shrink-0 border border-blue-100">
                <Wrench size={12} />
                {interventionsLinkedCount} interventions SAV liées
              </div>
            </div>
          </div>

          <MissionTable ref={tableRef} missions={visibleMissions} onMissionsChanged={refreshMissions} />
        </div>

      </div>
    </div>
  )
}
