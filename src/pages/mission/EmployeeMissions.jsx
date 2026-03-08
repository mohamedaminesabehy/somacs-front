import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, Wrench, AlertTriangle, CheckCircle2, Clock,
  Filter, Search, ChevronRight, Link2, Building2,
  Calendar, XCircle, Loader2, BarChart2, User,
  ChevronLeft, LayoutList, CalendarDays, MapPin,
  TrendingUp, Zap,
} from 'lucide-react'
import { getMissionStore, updateMissionInStore, interventionsList, statusList, priorityColors, getStatusColor } from '../../data/missionsData'

const CURRENT_EMPLOYEE_ID = 1
const PRIORITY_ORDER = { Critique: 1, Haute: 2, Moyenne: 3, Basse: 4 }

const PRIORITY_BAR = {
  red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-yellow-400', gray: 'bg-slate-300',
}

const STATUS_CONFIG = {
  'À faire':  { icon: ClipboardList, badge: 'bg-blue-50 text-blue-700 border border-blue-200',     dot: 'bg-blue-500',   color: 'text-blue-600',   calBg: 'bg-blue-50 border-blue-200' },
  'En cours': { icon: Loader2,       badge: 'bg-amber-50 text-amber-700 border border-amber-200',  dot: 'bg-amber-500',  color: 'text-amber-600',  calBg: 'bg-amber-50 border-amber-200' },
  'Terminée': { icon: CheckCircle2,  badge: 'bg-green-50 text-green-700 border border-green-200',  dot: 'bg-green-500',  color: 'text-green-600',  calBg: 'bg-green-50 border-green-200' },
  'Bloquée':  { icon: XCircle,       badge: 'bg-red-50 text-red-700 border border-red-200',        dot: 'bg-red-500',    color: 'text-red-600',    calBg: 'bg-red-50 border-red-200' },
}

// ── Utilitaire : parse "DD Mois YYYY" / "Aujourd'hui" → Date ──────────────────
const MONTHS_FR = {
  janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
}

function parseDueDate(str) {
  if (!str) return null
  const lower = str.toLowerCase().trim()
  if (lower === "aujourd'hui" || lower === 'aujourd\'hui') return new Date()
  // "DD Mois YYYY"
  const parts = lower.split(' ')
  if (parts.length === 3) {
    const day   = parseInt(parts[0], 10)
    const month = MONTHS_FR[parts[1]]
    const year  = parseInt(parts[2], 10)
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day)
    }
  }
  return null
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

// ── Composant : badge statut ──────────────────────────────────────────────────
function StatusBadge({ status, spin }) {
  const cfg  = STATUS_CONFIG[status] || STATUS_CONFIG['À faire']
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${cfg.badge}`}>
      <Icon size={10} className={spin && status === 'En cours' ? 'animate-spin' : ''} />
      {status}
    </span>
  )
}

// ── Composant : carte liste ───────────────────────────────────────────────────
function MissionRow({ mission, onStatusChange, onOpen }) {
  const intervention = mission.interventionId
    ? interventionsList.find((i) => i.id === mission.interventionId)
    : null
  const cfg = STATUS_CONFIG[mission.status] || STATUS_CONFIG['À faire']

  return (
    <div
      className="bg-white rounded-xl border border-slate-100 hover:border-[#0052CC]/30 hover:shadow-sm transition-all duration-200 overflow-hidden cursor-pointer group"
      onClick={() => onOpen(mission.id)}
    >
      {/* Priority bar */}
      <div className={`h-0.5 w-full ${PRIORITY_BAR[mission.priorityColor] || 'bg-slate-200'}`} />

      <div className="px-3 py-2.5 flex items-center gap-3">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          mission.type === 'Intervention' ? 'bg-[#0052CC] text-white' : 'bg-slate-100 text-slate-500'
        }`}>
          {mission.type === 'Intervention' ? <Wrench size={14} /> : <ClipboardList size={14} />}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {mission.type === 'Intervention' && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#0052CC]/10 text-[#0052CC] uppercase tracking-wider">SAV</span>
            )}
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${priorityColors[mission.priorityColor] || 'bg-slate-100 text-slate-600'}`}>
              {mission.priority}
            </span>
          </div>
          <p className="font-black text-slate-900 text-xs leading-snug truncate">{mission.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {mission.dueDate && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-400"><Calendar size={9} />{mission.dueDate}</span>
            )}
            {mission.site && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-400 truncate"><Building2 size={9} />{mission.site}</span>
            )}
          </div>
        </div>

        {/* Status + quick switcher */}
        <div className="shrink-0 flex flex-col items-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <StatusBadge status={mission.status} spin />
          <div className="flex gap-0.5">
            {statusList.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onStatusChange(mission.id, s)}
                title={s}
                className={`w-2 h-2 rounded-full border transition-all ${
                  mission.status === s
                    ? `${cfg.dot} border-transparent scale-125`
                    : 'bg-white border-slate-200 hover:border-slate-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight size={13} className="text-slate-300 group-hover:text-[#0052CC] transition-colors shrink-0" />
      </div>
    </div>
  )
}

// ── Composant : Calendrier ────────────────────────────────────────────────────
const DAYS_FR  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_LABEL = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function MissionCalendar({ missions, onOpen, onStatusChange }) {
  const today = new Date()
  const [calYear,  setCalYear]  = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState(null) // Date selected

  // Build grid: weeks of the month, Mon-first
  const firstDay = new Date(calYear, calMonth, 1)
  const lastDay  = new Date(calYear, calMonth + 1, 0)
  // Mon=0 … Sun=6
  const startOffset = (firstDay.getDay() + 6) % 7
  const days = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(calYear, calMonth, d))

  // Map missions → parsed date
  const missionsByDay = useMemo(() => {
    const map = {}
    missions.forEach((m) => {
      const d = parseDueDate(m.dueDate)
      if (!d) return
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(m)
    })
    return map
  }, [missions])

  function getMissionsForDay(date) {
    if (!date) return []
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    return missionsByDay[key] || []
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
    setSelected(null)
  }

  const selectedMissions = selected ? getMissionsForDay(selected) : []

  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500">

      {/* Calendar card */}
      <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">

        {/* Nav */}
        <div className="px-6 py-5 border-b-2 border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0052CC] rounded-xl flex items-center justify-center">
              <CalendarDays size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {MONTHS_LABEL[calMonth]} {calYear}
              </h2>
              <p className="text-xs text-slate-400 font-medium">Cliquez sur un jour pour voir les missions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); setSelected(today) }}
              className="px-3 py-1.5 rounded-xl text-[11px] font-black text-[#0052CC] bg-[#0052CC]/10 hover:bg-[#0052CC]/20 transition-all uppercase tracking-wider"
            >
              Aujourd'hui
            </button>
            <button
              onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Grid header */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS_FR.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Grid cells */}
        <div className="grid grid-cols-7">
          {days.map((date, idx) => {
            const dayMissions = date ? getMissionsForDay(date) : []
            const isToday     = date && isSameDay(date, today)
            const isSelected  = date && selected && isSameDay(date, selected)
            const hasMissions = dayMissions.length > 0

            return (
              <div
                key={idx}
                onClick={() => date && setSelected(isSelected ? null : date)}
                className={`min-h-[80px] border-b border-r border-slate-50 p-1.5 flex flex-col transition-all ${
                  !date ? 'bg-slate-50/50' :
                  isSelected ? 'bg-[#0052CC]/5 cursor-pointer' :
                  'hover:bg-slate-50 cursor-pointer'
                }`}
              >
                {date && (
                  <>
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black mb-1 mx-auto transition-all ${
                      isToday
                        ? 'bg-[#0052CC] text-white shadow-md shadow-blue-200'
                        : isSelected
                          ? 'bg-[#0052CC]/20 text-[#0052CC]'
                          : 'text-slate-600 hover:bg-slate-100'
                    }`}>
                      {date.getDate()}
                    </span>
                    {/* Mission dots / chips */}
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {dayMissions.slice(0, 2).map((m) => {
                        const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG['À faire']
                        return (
                          <div
                            key={m.id}
                            onClick={(e) => { e.stopPropagation(); onOpen(m.id) }}
                            title={m.title}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate border leading-tight hover:opacity-80 transition-opacity ${cfg.calBg}`}
                          >
                            {m.title}
                          </div>
                        )
                      })}
                      {dayMissions.length > 2 && (
                        <span className="text-[9px] font-black text-slate-400 px-1.5">+{dayMissions.length - 2}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t border-slate-50 flex items-center gap-5">
          {Object.entries(STATUS_CONFIG).map(([label, cfg]) => (
            <span key={label} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />{label}
            </span>
          ))}
        </div>
      </div>

      {/* Selected day panel */}
      {selected && (
        <div className="bg-white rounded-2xl border-2 border-[#0052CC]/20 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-6 py-4 border-b-2 border-blue-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0052CC] text-white rounded-xl flex items-center justify-center font-black text-sm">
                {selected.getDate()}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">
                  {selected.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  {selectedMissions.length} mission{selectedMissions.length !== 1 ? 's' : ''} ce jour
                </p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <XCircle size={16} />
            </button>
          </div>

          {selectedMissions.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <CalendarDays size={32} className="text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 font-bold text-sm">Aucune mission ce jour</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {selectedMissions.map((m) => (
                <MissionRow
                  key={m.id}
                  mission={m}
                  onStatusChange={onStatusChange}
                  onOpen={onOpen}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function EmployeeMissions() {
  const navigate = useNavigate()
  const today    = new Date()

  const [missions, setMissions] = useState(() =>
    getMissionStore().filter((m) => m.employeeId === CURRENT_EMPLOYEE_ID)
  )
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('Tous')
  const [filterType,   setFilterType]   = useState('Tous')

  const handleStatusChange = (missionId, newStatus) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== missionId) return m
        const updated = { ...m, status: newStatus, statusColor: getStatusColor(newStatus) }
        updateMissionInStore(updated)
        return updated
      })
    )
  }

  const filtered = useMemo(() => {
    return missions
      .filter((m) => {
        if (filterStatus !== 'Tous' && m.status !== filterStatus) return false
        if (filterType   !== 'Tous' && m.type   !== filterType)   return false
        if (search && !m.title.toLowerCase().includes(search.toLowerCase()) &&
            !m.description.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })
      .sort((a, b) => (PRIORITY_ORDER[a.priority] || 9) - (PRIORITY_ORDER[b.priority] || 9))
  }, [missions, filterStatus, filterType, search])

  const total     = missions.length
  const enCours   = missions.filter((m) => m.status === 'En cours').length
  const terminees = missions.filter((m) => m.status === 'Terminée').length
  const bloquees  = missions.filter((m) => m.status === 'Bloquée').length

  // Prochaine mission urgente (Critique / Haute non terminée)
  const nextUrgent = useMemo(() =>
    missions
      .filter((m) => m.status !== 'Terminée' && (m.priority === 'Critique' || m.priority === 'Haute'))
      .sort((a, b) => (PRIORITY_ORDER[a.priority] || 9) - (PRIORITY_ORDER[b.priority] || 9))[0]
  , [missions])

  const hasActiveFilters = search || filterStatus !== 'Tous' || filterType !== 'Tous'

  return (
    <div className="flex flex-col h-screen bg-slate-50">

      {/* ═══════════════════ HEADER ═══════════════════ */}
      <div className="bg-white border-b-2 border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#0052CC] to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <ClipboardList size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Mes Missions</h1>
              <span className="px-2 py-0.5 bg-[#0052CC]/10 text-[#0052CC] text-[10px] font-black rounded-full uppercase tracking-wider">
                Technicien
              </span>
            </div>
            <p className="text-slate-400 text-xs font-semibold flex items-center gap-1">
              <User size={10} /> Jean Dupont — {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* KPI inline dans le header */}
        <div className="hidden lg:flex items-center gap-2">
          {[
            { label: 'Total',     value: total,     bg: 'bg-blue-50',   text: 'text-blue-600'  },
            { label: 'En cours',  value: enCours,   bg: 'bg-amber-50',  text: 'text-amber-600' },
            { label: 'Terminées', value: terminees, bg: 'bg-green-50',  text: 'text-green-600' },
            { label: 'Bloquées',  value: bloquees,  bg: 'bg-red-50',    text: 'text-red-600'   },
          ].map(({ label, value, bg, text }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2 ${bg} rounded-xl`}>
              <span className={`text-lg font-black ${text}`}>{value}</span>
              <span className="text-[11px] font-bold text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════ BODY : 2 colonnes fixes ═══════════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── COLONNE GAUCHE : Calendrier ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-y-auto border-r-2 border-slate-100 bg-white">

          {/* Alerte urgente */}
          {nextUrgent && (
            <div
              className="mx-4 mt-4 bg-red-50 border-2 border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all shrink-0"
              onClick={() => navigate('/missions/' + nextUrgent.id)}
            >
              <div className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center shrink-0">
                <Zap size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-wider leading-none mb-0.5">Prioritaire</p>
                <p className="font-black text-slate-900 text-xs truncate">{nextUrgent.title}</p>
              </div>
              <StatusBadge status={nextUrgent.status} />
            </div>
          )}

          {/* Calendrier */}
          <div className="flex-1 p-4">
            <MissionCalendar
              missions={missions}
              onOpen={(id) => navigate('/missions/' + id)}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>

        {/* ── COLONNE DROITE : Liste missions ── */}
        <div className="w-[380px] shrink-0 flex flex-col bg-slate-50 overflow-hidden">

          {/* En-tête colonne droite */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 shrink-0 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <LayoutList size={15} className="text-[#0052CC]" />
                Toutes les missions
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-black">{filtered.length}</span>
              </h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setFilterStatus('Tous'); setFilterType('Tous') }}
                  className="flex items-center gap-1 text-[11px] font-black text-red-500 hover:text-red-700 transition-colors"
                >
                  <XCircle size={12} /> Reset
                </button>
              )}
            </div>

            {/* Recherche */}
            <div className="relative group mb-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" />
              <input
                type="text"
                placeholder="Rechercher une mission..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all hover:border-slate-300"
              />
            </div>

            {/* Filtres statut + type */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-2 py-1.5 border-2 border-slate-200 rounded-xl text-xs bg-white focus:border-[#0052CC] outline-none font-bold text-slate-600 hover:border-slate-300 transition-all"
              >
                <option value="Tous">Tous statuts</option>
                {statusList.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 px-2 py-1.5 border-2 border-slate-200 rounded-xl text-xs bg-white focus:border-[#0052CC] outline-none font-bold text-slate-600 hover:border-slate-300 transition-all"
              >
                <option value="Tous">Tous types</option>
                <option value="Normal">Normal</option>
                <option value="Intervention">SAV</option>
              </select>
            </div>
          </div>

          {/* Liste scrollable */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-12 h-12 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ClipboardList size={22} className="text-slate-300" />
                </div>
                <p className="text-slate-600 font-black text-sm">Aucune mission</p>
                <p className="text-slate-400 text-xs mt-1">Modifiez vos filtres</p>
              </div>
            ) : (
              filtered.map((m) => (
                <MissionRow
                  key={m.id}
                  mission={m}
                  onStatusChange={handleStatusChange}
                  onOpen={(id) => navigate('/missions/' + id)}
                />
              ))
            )}
          </div>

          {/* Footer colonne droite */}
          <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(STATUS_CONFIG).map(([label, cfg]) => (
                <span key={label} className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{label}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
