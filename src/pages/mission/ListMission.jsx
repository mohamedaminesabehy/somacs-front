import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Download,
  Calendar, Clock, CheckCircle2, AlertCircle, Layers,
  ArrowUpRight, Wrench, ClipboardList, RefreshCw,
  SlidersHorizontal, X, TrendingUp,
} from 'lucide-react'
import MissionTable from '../../components/mission/MissionTable'

// ── KPI data ──────────────────────────────────────────────────────────────────
const kpis = [
  {
    key: 'today',
    label: "Missions du jour",
    value: 12,
    delta: '+3',
    deltaLabel: 'depuis hier',
    deltaUp: true,
    icon: Calendar,
    accent: 'blue',
  },
  {
    key: 'inprogress',
    label: 'En cours',
    value: 28,
    delta: '8',
    deltaLabel: 'prioritaires',
    deltaUp: null,
    icon: Clock,
    accent: 'amber',
  },
  {
    key: 'done',
    label: 'Terminées',
    value: 156,
    delta: '+12',
    deltaLabel: 'cette semaine',
    deltaUp: true,
    icon: CheckCircle2,
    accent: 'emerald',
  },
  {
    key: 'blocked',
    label: 'Bloquées',
    value: 5,
    delta: '!',
    deltaLabel: 'Attention requise',
    deltaUp: false,
    icon: AlertCircle,
    accent: 'red',
  },
]

const accentMap = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-100',    icon: 'bg-blue-100 text-blue-600',     value: 'text-blue-700',    delta: 'text-blue-500',    bar: 'bg-blue-500'    },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-100',   icon: 'bg-amber-100 text-amber-600',   value: 'text-amber-700',   delta: 'text-amber-500',   bar: 'bg-amber-500'   },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'bg-emerald-100 text-emerald-600',value: 'text-emerald-700', delta: 'text-emerald-500', bar: 'bg-emerald-500' },
  red:     { bg: 'bg-red-50',     border: 'border-red-100',     icon: 'bg-red-100 text-red-600',       value: 'text-red-700',     delta: 'text-red-500',     bar: 'bg-red-500'     },
}

// ── Quick-filter status tabs ───────────────────────────────────────────────────
const statusTabs = [
  { key: 'all',      label: 'Toutes',    count: 6 },
  { key: 'À faire',  label: 'À faire',   count: 2 },
  { key: 'En cours', label: 'En cours',  count: 2 },
  { key: 'Terminée', label: 'Terminées', count: 1 },
  { key: 'Bloquée',  label: 'Bloquées',  count: 1 },
]

// ── KPI Card component ────────────────────────────────────────────────────────
function KpiCard({ kpi }) {
  const a = accentMap[kpi.accent]
  const Icon = kpi.icon
  return (
    <div className={`relative flex flex-col gap-3 rounded-2xl border ${a.border} ${a.bg} p-5 overflow-hidden group hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.icon}`}>
          <Icon size={20} />
        </div>
        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
      </div>
      <div>
        <p className={`text-3xl font-black tracking-tight ${a.value}`}>{kpi.value}</p>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">{kpi.label}</p>
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${a.delta}`}>
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
  const tableRef = useRef(null)

  const [search, setSearch]                 = useState('')
  const [filterEmployee, setFilterEmployee] = useState('all')
  const [filterStatus, setFilterStatus]     = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterType, setFilterType]         = useState('all')
  const [filterDate, setFilterDate]         = useState('')
  const [activeTab, setActiveTab]           = useState('all')
  const [filtersOpen, setFiltersOpen]       = useState(false)

  const hasActiveFilters =
    search !== '' ||
    filterEmployee !== 'all' ||
    filterStatus !== 'all' ||
    filterPriority !== 'all' ||
    filterType !== 'all' ||
    filterDate !== ''

  const activeFilterCount = [
    search !== '',
    filterEmployee !== 'all',
    filterStatus !== 'all',
    filterPriority !== 'all',
    filterType !== 'all',
    filterDate !== '',
  ].filter(Boolean).length

  const resetFilters = () => {
    setSearch('')
    setFilterEmployee('all')
    setFilterStatus('all')
    setFilterPriority('all')
    setFilterType('all')
    setFilterDate('')
    setActiveTab('all')
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-[#0052CC] flex items-center justify-center shadow-lg shadow-blue-200">
                <Layers size={18} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des missions</h1>
            </div>
            <p className="text-sm text-slate-500 font-medium ml-12">
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
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-[#0052CC] text-xs font-black">6</span>
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

                <button
                  onClick={() => setFiltersOpen((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    filtersOpen || hasActiveFilters
                      ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-md shadow-blue-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <SlidersHorizontal size={15} />
                  Filtres
                  {hasActiveFilters && (
                    <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-black flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

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
            {filtersOpen && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employé</label>
                  <select
                    value={filterEmployee}
                    onChange={(e) => setFilterEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 bg-white"
                  >
                    <option value="all">Tous les employés</option>
                    <option value="Jean Dupont">Jean Dupont</option>
                    <option value="Sarah Martin">Sarah Martin</option>
                    <option value="Pierre Martin">Pierre Martin</option>
                    <option value="Marc Dubois">Marc Dubois</option>
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
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 bg-white"
                  />
                </div>
              </div>
            )}

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
                2 interventions SAV liées
              </div>
            </div>
          </div>

          {/* MissionTable — handles its own pagination, modals, CRUD */}
          <MissionTable ref={tableRef} />
        </div>

      </div>
    </div>
  )
}
