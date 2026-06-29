import { useCallback, useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Wrench,
  ChevronRight, Link2, Building2,
  Calendar, User,
  ChevronLeft, LayoutList, CalendarDays,
  Zap,
} from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import {
  MISSION_PRIORITY_BAR as PRIORITY_BAR,
  MISSION_PRIORITY_COLORS as priorityColors,
  MISSION_PRIORITY_ORDER as PRIORITY_ORDER,
  MISSION_STATUS_CONFIG as STATUS_CONFIG,
  MISSION_STATUS_LIST as statusList,
  getMissionPriorityColor as getPriorityColor,
  getMissionStatusColorKey as getStatusColorKey,
} from '../../constants/missionConstants'

function getAvatarFromName(name) {
  if (!name) return ''
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
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
    return groupStatus
      ? { ...mission, status: groupStatus, statusColor: getStatusColorKey(groupStatus) }
      : mission
  })
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) {
    const [y, m, d] = lower.split('-').map((n) => parseInt(n, 10))
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
      return new Date(y, m - 1, d)
    }
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(lower)) {
    const [dd, mm, yyyy] = lower.split('/').map((n) => parseInt(n, 10))
    if (!Number.isNaN(dd) && !Number.isNaN(mm) && !Number.isNaN(yyyy)) {
      return new Date(yyyy, mm - 1, dd)
    }
  }
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
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                mission.type === 'Intervention'
                  ? 'bg-[#0052CC]/10 text-[#0052CC]'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {mission.type === 'Intervention' ? 'Intervention' : 'Normal'}
            </span>
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

function MissionCalendar({ missions, interventions = [], onOpen }) {
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

  // Fermer le modal avec Échap
  useEffect(() => {
    if (!selected) return
    const handler = (e) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected])

  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500">

      {/* Calendar card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">

        {/* Nav */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between bg-white gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#0052CC] rounded-xl flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
              <CalendarDays size={18} className="text-white w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                {MONTHS_LABEL[calMonth]} <span className="text-slate-500 font-bold">{calYear}</span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold mt-0.5">Cliquez sur un jour pour voir les missions</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200 hover:border-[#0052CC]/40 hover:bg-[#0052CC]/5 text-slate-600 hover:text-[#0052CC] transition-all active:scale-95"
            >
              <ChevronLeft size={15} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); setSelected(today) }}
              className="px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black text-[#0052CC] bg-[#0052CC]/10 hover:bg-[#0052CC]/20 transition-all uppercase tracking-wider border border-[#0052CC]/30"
            >
              Aujourd'hui
            </button>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200 hover:border-[#0052CC]/40 hover:bg-[#0052CC]/5 text-slate-600 hover:text-[#0052CC] transition-all active:scale-95"
            >
              <ChevronRight size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Calendar grid wrapper */}
        <div>

        {/* Grid header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100">
          {DAYS_FR.map((d) => (
            <div key={d} className="py-2.5 sm:py-2.5 text-center text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider sm:tracking-widest truncate px-0.5">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{d.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Grid cells */}
        <div className="grid grid-cols-7 divide-x divide-slate-100">
          {days.map((date, idx) => {
            const dayMissions = date ? getMissionsForDay(date) : []
            const isToday     = date && isSameDay(date, today)
            const isSelected  = date && selected && isSameDay(date, selected)

            return (
              <div
                key={idx}
                onClick={() => date && setSelected(date)}
                className={`min-h-[60px] sm:min-h-[90px] border-b border-slate-100 p-1.5 sm:p-2 flex flex-col transition-colors ${
                  !date      ? 'bg-slate-50' :
                  isSelected ? 'bg-blue-50 cursor-pointer' :
                               'bg-white hover:bg-slate-50 cursor-pointer'
                }`}
              >
                {date && (
                  <>
                    <span className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[11px] sm:text-xs font-black mb-1 sm:mb-1.5 mx-auto transition-all ${
                      isToday
                        ? 'bg-[#0052CC] text-white shadow-md shadow-blue-200'
                        : isSelected
                          ? 'bg-[#0052CC]/20 text-[#0052CC] font-black'
                          : 'text-slate-700 hover:bg-slate-200'
                    }`}>
                      {date.getDate()}
                    </span>
                    {/* Mission chips */}
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {dayMissions.slice(0, 2).map((m) => {
                        const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG['À faire']
                        return (
                          <div
                            key={m.id}
                            onClick={(e) => { e.stopPropagation(); setSelected(date) }}
                            title={m.title}
                            className={`text-[9px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-[3px] sm:py-[3px] rounded truncate border leading-tight hover:brightness-95 transition-all w-full text-center sm:text-left ${cfg.calBg}`}
                          >
                            <span className="hidden sm:block truncate">{m.title}</span>
                          </div>
                        )
                      })}
                      {dayMissions.length > 2 && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setSelected(date) }}
                          className="text-[9px] sm:text-[9px] font-black text-slate-500 px-1 cursor-pointer hover:text-slate-700 text-center sm:text-left truncate"
                        >
                          +{dayMissions.length - 2} <span className="hidden sm:inline">autres</span>
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
        </div>

        {/* Legend */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-center sm:justify-start gap-3 sm:gap-5 flex-wrap">
          {Object.entries(STATUS_CONFIG).map(([label, cfg]) => (
            <span key={label} className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] font-bold text-slate-600">
              <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${cfg.dot}`} />{label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Modal jour sélectionné ── */}
      {selected && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          {/* Panel */}
          <div
            className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >

            {/* ── Header (couleur sidebar = slate-900) ── */}
            <div className="bg-slate-900 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 shrink-0">

              {/* Top row : date block + close */}
              <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                <div className="flex items-center gap-3">
                  {/* Mini calendar block */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 border border-white/20 rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {selected.toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white leading-tight">{selected.getDate()}</span>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm sm:text-[15px] leading-snug capitalize">
                      {selected.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </p>
                    <p className="text-slate-400 text-[11px] sm:text-xs font-semibold">
                      {selected.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white border border-white/10 transition-all shrink-0"
                >
                  <XCircle size={16} />
                </button>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white/10 border border-white/15 rounded-lg text-[10px] sm:text-[11px] font-black text-white">
                  <ClipboardList size={11} className="text-slate-400" />
                  {selectedMissions.length} mission{selectedMissions.length !== 1 ? 's' : ''}
                </span>
                {selectedMissions.filter(m => m.status === 'En cours').length > 0 && (
                  <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-[10px] sm:text-[11px] font-black text-amber-300">
                    <Loader2 size={11} /> {selectedMissions.filter(m => m.status === 'En cours').length} en cours
                  </span>
                )}
                {selectedMissions.some(m => m.priority === 'Critique') && (
                  <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-[10px] sm:text-[11px] font-black text-red-300">
                    <Zap size={11} /> Critique
                  </span>
                )}
              </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto bg-slate-50">
              {selectedMissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
                    <CalendarDays size={24} className="text-slate-300" />
                  </div>
                  <p className="text-slate-700 font-black text-sm">Aucune mission ce jour</p>
                  <p className="text-slate-400 text-xs mt-1">Aucune tâche planifiée pour cette date.</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {selectedMissions.map((m) => {
                    const intervention = m.interventionId
                      ? interventions.find((iv) => iv.id === m.interventionId)
                      : null
                    return (
                      <div
                        key={m.id}
                        onClick={() => { setSelected(null); onOpen(m.id) }}
                        className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer hover:shadow-md transition-all overflow-hidden"
                      >
                        {/* Top: priority stripe */}
                        <div className={`h-1 w-full ${PRIORITY_BAR[m.priorityColor] || 'bg-slate-200'}`} />

                        <div className="px-3 sm:px-4 py-3">
                          {/* Row 1: badges + status */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                  m.type === 'Intervention'
                                    ? 'bg-[#0052CC]/10 text-[#0052CC]'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {m.type === 'Intervention' ? 'Intervention' : 'Normal'}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${priorityColors[m.priorityColor] || 'bg-slate-100 text-slate-600'}`}>
                                {m.priority}
                              </span>
                            </div>
                            <StatusBadge status={m.status} spin />
                          </div>

                          {/* Row 2: title */}
                          <p className="font-black text-slate-900 text-sm leading-snug">{m.title}</p>

                          {/* Row 3: description */}
                          {m.description && (
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5 line-clamp-1">{m.description}</p>
                          )}

                          {/* Row 4: meta */}
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {m.site && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                                <Building2 size={10} className="text-slate-300" />{m.site}
                              </span>
                            )}
                            {intervention && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-700 font-black font-mono">
                                <Link2 size={10} className="text-slate-400" />{intervention.id}
                              </span>
                            )}
                            <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 font-semibold group-hover:text-slate-600 transition-colors">
                              Voir les détails <ChevronRight size={11} />
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="px-4 sm:px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="hidden sm:flex items-center gap-3 flex-wrap">
                {Object.entries(STATUS_CONFIG).map(([label, cfg]) => (
                  <span key={label} className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />{label}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all sm:ml-auto"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default function EmployeeMissions() {
  const navigate = useNavigate()
  const today    = new Date()

  const currentUser = useMemo(() => {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem('auth_user')
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return {
        id: typeof parsed?.id === 'number' ? parsed.id : Number(parsed?.id) || null,
        name: String(parsed?.name || '').trim(),
      }
    } catch {
      return null
    }
  }, [])

  const [missions, setMissions] = useState([])
  const [interventions, setInterventions] = useState([])
  const [filterStatus, setFilterStatus] = useState('Tous')
  const [filterType,   setFilterType]   = useState('Tous')

  const refreshMissions = useCallback(async () => {
    try {
      const response = await apiFetch('/missions', { auth: true, cache: 'no-store' })
      if (!response.ok) return
      const data = await response.json()
      const rows = Array.isArray(data) ? data : []
      const syncedRows = synchronizeGroupedMissionStatuses(rows)
      const filteredByUser =
        currentUser && currentUser.id
          ? syncedRows.filter((m) => Number(m.employeeUserId) === Number(currentUser.id))
          : currentUser && currentUser.name
            ? syncedRows.filter((m) => String(m.employee || '').trim() === currentUser.name)
            : syncedRows

      const normalized = filteredByUser.map((m) => ({
        ...m,
        avatar: getAvatarFromName(m.employee),
        priorityColor: getPriorityColor(m.priority),
        statusColor: getStatusColorKey(m.status),
      }))
      setMissions((prev) => {
        // Keep locally-known terminated missions that server may omit
        const prevTerminees = Array.isArray(prev) ? prev.filter((m) => m.status === 'Terminée') : []
        const existingIds = new Set(normalized.map((m) => m.id))
        const merged = [
          ...normalized,
          ...prevTerminees.filter((m) => !existingIds.has(m.id))
        ]
        return merged
      })
    } catch {
      // Mission refresh is best-effort; keep the current list.
    }
  }, [currentUser])

  useEffect(() => {
    refreshMissions()
  }, [refreshMissions])

  // Keep local missions list in sync when a mission is updated elsewhere
  useEffect(() => {
    const handler = (e) => {
      const updated = e?.detail
      if (!updated) return
      const normalized = {
        ...updated,
        avatar: getAvatarFromName(updated.employee),
        priorityColor: getPriorityColor(updated.priority),
        statusColor: getStatusColorKey(updated.status),
      }
      setMissions((prev) => {
        const exists = prev.some((m) => m.id === normalized.id)
        if (exists) return prev.map((m) => (m.id === normalized.id ? { ...m, ...normalized } : m))
        return [normalized, ...prev]
      })
    }
    window.addEventListener('mission:updated', handler)
    return () => window.removeEventListener('mission:updated', handler)
  }, [])

  useEffect(() => {
    const onFocus = () => {
      refreshMissions()
    }
    window.addEventListener('focus', onFocus)
    const timerId = window.setInterval(() => {
      refreshMissions()
    }, 5000)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.clearInterval(timerId)
    }
  }, [refreshMissions])

  useEffect(() => {
    ;(async () => {
      try {
        const response = await apiFetch('/interventions', { auth: true, cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        const rows = Array.isArray(data) ? data : []
        const normalized = rows.map((i) => ({
          id: i.id,
          client: i.client || i.clientName || '',
          machine: i.machine || i.machineType || '',
          type: i.type || '',
          status: i.status || '',
          statusLabel: i.status || '',
          date: i.date || i.interventionDate || '',
          phone: i.phone || i.clientPhone || '',
          clientCode: i.clientCode || '',
          address: i.clientAddress || '',
          request: i.request || i.problemDescription || '',
          assignedTo: i.assignedTo || i.assignee || i.technicianName || null,
        }))
        setInterventions(normalized)
      } catch {
        // Intervention metadata is optional for employee mission cards.
      }
    })()
  }, [])

  const handleStatusChange = (missionId, newStatus) => {
    setMissions((prev) => {
      const source = prev.find((m) => m.id === missionId) || null
      const groupId = String(source?.assignmentGroupId || '').trim()
      return prev.map((m) => {
        if (m.id === missionId) {
          return { ...m, status: newStatus, statusColor: getStatusColorKey(newStatus) }
        }
        if (groupId && String(m?.assignmentGroupId || '').trim() === groupId) {
          return { ...m, status: newStatus, statusColor: getStatusColorKey(newStatus) }
        }
        return m
      })
    })

    ;(async () => {
      try {
        const response = await apiFetch(`/missions/${missionId}`, {
          method: 'PATCH',
          body: { status: newStatus },
          auth: true,
        })
        if (response.ok) {
          refreshMissions()
        }
      } catch {
        // The optimistic status update remains visible if refresh fails.
      }
    })()
  }

  // Missions d'aujourd'hui filtrées par statut et priorité
  const todayFiltered = useMemo(() => {
    const todayRef = new Date()
    return missions
      .filter((m) => {
        // Filtrer uniquement les missions d'aujourd'hui
        const parsed = parseDueDate(m?.dueDate)
        if (!parsed) return false
        if (!isSameDay(parsed, todayRef)) return false
        // Filtre statut
        if (filterStatus !== 'Tous' && m.status !== filterStatus) return false
        // Filtre prioritaire (Critique ou Haute uniquement)
        if (filterType === 'Prioritaire' && m.priority !== 'Critique' && m.priority !== 'Haute') return false
        return true
      })
      .sort((a, b) => (PRIORITY_ORDER[a.priority] || 9) - (PRIORITY_ORDER[b.priority] || 9))
  }, [missions, filterStatus, filterType])

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

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50">

      {/* ═══════════════════ HEADER ═══════════════════ */}
      <div className="bg-white border-b-2 border-slate-200 px-4 lg:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#0052CC] to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
            <ClipboardList size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Mes Missions</h1>
              <span className="px-2 py-0.5 bg-[#0052CC]/10 text-[#0052CC] text-[10px] font-black rounded-full uppercase tracking-wider">
                Technicien
              </span>
              <span className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span className="text-sm font-black text-blue-600 leading-none">{total}</span>
                <span className="text-[10px] font-bold text-slate-500">Total</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs font-semibold flex items-center gap-1 mt-0.5">
              <User size={10} /> {currentUser?.name || '—'} <span className="hidden sm:inline">— {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </p>
          </div>
        </div>

        {/* KPI inline dans le header */}
        <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap pb-2 lg:pb-0 w-full lg:w-auto">
          {[
            { label: 'Total',     value: total,     bg: 'bg-blue-50',   text: 'text-blue-600',  ring: 'border-blue-100',  dot: 'bg-blue-500', hideOnMobile: true  },
            { label: 'En cours',  value: enCours,   bg: 'bg-amber-50',  text: 'text-amber-600', ring: 'border-amber-100', dot: 'bg-amber-500', hideOnMobile: false },
            { label: 'Terminées', value: terminees, bg: 'bg-green-50',  text: 'text-green-600', ring: 'border-green-100', dot: 'bg-green-500', hideOnMobile: false },
            { label: 'Bloquées',  value: bloquees,  bg: 'bg-red-50',    text: 'text-red-600',   ring: 'border-red-100',   dot: 'bg-red-500',  hideOnMobile: false },
          ].map(({ label, value, bg, text, ring, dot, hideOnMobile }) => (
            <div key={label} className={`flex items-center gap-2.5 px-3.5 py-2 ${bg} border ${ring} rounded-xl shrink-0 ${hideOnMobile ? 'hidden lg:flex' : ''}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              <span className={`text-lg font-black ${text} leading-none`}>{value}</span>
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════ BODY : 2 colonnes ═══════════════════ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-visible lg:overflow-hidden">

        {/* ── COLONNE GAUCHE : Calendrier ── */}
        <div className="flex flex-col w-full lg:flex-1 min-w-0 lg:overflow-y-auto scrollbar-gray border-b-2 lg:border-b-0 lg:border-r-2 border-slate-100 bg-white">

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
          <div className="flex-1 p-4 sm:p-6 lg:p-4">
            <MissionCalendar
              missions={missions}
              interventions={interventions}
              onOpen={(id) => navigate('/missions/' + id)}
            />
          </div>
        </div>

        {/* ── COLONNE DROITE : Liste missions ── */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-slate-50 lg:overflow-hidden">

          {/* En-tête colonne droite */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 shrink-0 bg-white sm:bg-slate-50/60 transition-all sticky top-0 z-10 lg:static">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 tracking-tight">
                <div className="w-6 h-6 bg-[#0052CC] rounded-md flex items-center justify-center shrink-0">
                  <LayoutList size={13} className="text-white" />
                </div>
                Missions d'aujourd'hui
                <span className="px-2 py-0.5 bg-[#0052CC]/10 text-[#0052CC] rounded-md text-[10px] font-black">{todayFiltered.length}</span>
              </h2>
              {(filterStatus !== 'Tous' || filterType !== 'Tous') && (
                <button
                  type="button"
                  onClick={() => { setFilterStatus('Tous'); setFilterType('Tous') }}
                  className="flex items-center gap-1 text-[11px] font-black text-red-500 hover:text-red-700 transition-colors"
                >
                  <XCircle size={12} /> Reset
                </button>
              )}
            </div>

            {/* Filtres : Prioritaire + Tous statuts */}
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value) }}
                className="flex-1 px-2 py-1.5 border-2 border-slate-200 rounded-xl text-xs bg-white focus:border-[#0052CC] outline-none font-bold text-slate-600 hover:border-slate-300 transition-all"
              >
                <option value="Tous">Toutes priorités</option>
                <option value="Prioritaire">Prioritaire</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value) }}
                className="flex-1 px-2 py-1.5 border-2 border-slate-200 rounded-xl text-xs bg-white focus:border-[#0052CC] outline-none font-bold text-slate-600 hover:border-slate-300 transition-all"
              >
                <option value="Tous">Tous statuts</option>
                {statusList.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Liste scrollable — missions d'aujourd'hui uniquement */}
          <div className="flex-1 lg:overflow-y-auto scrollbar-gray px-3 py-3 space-y-2 pb-10 lg:pb-3">
            {todayFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-12 h-12 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CalendarDays size={22} className="text-slate-300" />
                </div>
                <p className="text-slate-600 font-black text-sm">Aucune mission aujourd'hui jusqu'à maintenant.</p>
                <p className="text-slate-400 text-xs mt-1">Vous n'avez aucune mission planifiée pour aujourd'hui.</p>
              </div>
            ) : (
              todayFiltered.map((m) => (
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
