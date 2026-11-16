import { useCallback, useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Wrench,
  ClipboardList,

  ChevronRight, Link2, Building2,
  Calendar, MapPin, Settings,
  ChevronLeft, CalendarDays,
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

// ── Composant : carte mission mobile ──────────────────────────────────────────
function formatDueLabel(mission) {
  const date = parseDueDate(mission?.dueDate)
  if (!date) return mission?.dueDate || 'Date non définie'
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const label = isSameDay(date, now)
    ? "Aujourd'hui"
    : isSameDay(date, tomorrow)
      ? 'Demain'
      : date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  return mission?.dueTime ? `${label} · ${mission.dueTime}` : label
}

function MissionCard({ mission, intervention, onStatusChange, onOpen }) {
  const isIntervention = mission.type === 'Intervention'
  const reference = mission.reference || mission.code || `#${mission.id}`
  const machine = mission.machine || intervention?.machine
  const address = mission.address || intervention?.address

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${PRIORITY_BAR[mission.priorityColor] || 'bg-slate-200'}`} />
      <button
        type="button"
        onClick={() => onOpen(mission.id)}
        className="block w-full py-4 pl-5 pr-4 text-left transition-colors active:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isIntervention ? <Wrench size={12} aria-hidden="true" /> : <ClipboardList size={12} aria-hidden="true" />}
              <span className="truncate">{mission.type || 'Mission'}</span>
              <span className="font-mono normal-case tracking-normal text-slate-400">{reference}</span>
            </p>
            <h3 className="mt-1 text-pretty text-[15px] font-bold leading-snug text-slate-900">{mission.title}</h3>
          </div>
          <StatusBadge status={mission.status} spin />
        </div>

        <ul className="mt-3 flex flex-col gap-1.5 text-[13px] leading-relaxed text-slate-600">
          {mission.site && (
            <li className="flex items-start gap-2">
              <Building2 size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="min-w-0 break-words font-semibold text-slate-800">{mission.site}</span>
            </li>
          )}
          {address && (
            <li className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="min-w-0 break-words">{address}</span>
            </li>
          )}
          {machine && (
            <li className="flex items-start gap-2">
              <Settings size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="min-w-0 break-words">{machine}</span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <Calendar size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span>{formatDueLabel(mission)}</span>
          </li>
        </ul>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${priorityColors[mission.priorityColor] || 'bg-slate-100 text-slate-600'}`}>
            Priorité {String(mission.priority || '—').toLowerCase()}
          </span>
          {intervention && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
              <Link2 size={11} aria-hidden="true" />{intervention.id}
            </span>
          )}
        </div>
      </button>

      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/70 py-2.5 pl-5 pr-4">
        <label htmlFor={`mission-status-${mission.id}`} className="sr-only">
          Statut de la mission {mission.title}
        </label>
        <select
          id={`mission-status-${mission.id}`}
          value={mission.status}
          onChange={(e) => onStatusChange(mission.id, e.target.value)}
          className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
        >
          {statusList.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          type="button"
          onClick={() => onOpen(mission.id)}
          className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Ouvrir <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
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
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
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
              type="button"
              onClick={prevMonth}
              aria-label="Mois précédent"
              className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200 hover:border-brand-600/40 hover:bg-brand-600/5 text-slate-600 hover:text-brand-600 transition-all active:scale-95"
            >
              <ChevronLeft size={15} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); setSelected(today) }}
              className="px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black text-brand-600 bg-brand-600/10 hover:bg-brand-600/20 transition-all uppercase tracking-wider border border-brand-600/30"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Mois suivant"
              className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200 hover:border-brand-600/40 hover:bg-brand-600/5 text-slate-600 hover:text-brand-600 transition-all active:scale-95"
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
                role={date ? 'button' : undefined}
                tabIndex={date ? 0 : undefined}
                aria-pressed={date ? Boolean(isSelected) : undefined}
                aria-label={date ? `${date.getDate()} ${MONTHS_LABEL[calMonth]} — ${dayMissions.length} mission${dayMissions.length > 1 ? 's' : ''}` : undefined}
                onKeyDown={(e) => { if (date && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setSelected(date) } }}
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
                        ? 'bg-brand-600 text-white shadow-md shadow-blue-200'
                        : isSelected
                          ? 'bg-brand-600/20 text-brand-600 font-black'
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
                                    ? 'bg-brand-600/10 text-brand-600'
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
  const [activeTab, setActiveTab] = useState('today')
  const [onlyPriority, setOnlyPriority] = useState(false)

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
        return [
          ...normalized,
          ...prevTerminees.filter((m) => !existingIds.has(m.id))
        ]
      })
    } catch {
      // Mission refresh is best-effort; keep the current list.
    }
  }, [currentUser])

  useEffect(() => {
    // refreshMissions() only sets state after awaiting the API, so it cannot cascade synchronous renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    void (async () => {
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

    void (async () => {
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

  const missionLists = useMemo(() => {
    const todayRef = new Date()
    todayRef.setHours(0, 0, 0, 0)
    const byPriority = (a, b) => (PRIORITY_ORDER[a.priority] || 9) - (PRIORITY_ORDER[b.priority] || 9)
    const timeOf = (m) => parseDueDate(m?.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
    const pool = onlyPriority
      ? missions.filter((m) => m.priority === 'Critique' || m.priority === 'Haute')
      : missions
    return {
      today: pool.filter((m) => {
        const d = parseDueDate(m?.dueDate)
        return d && isSameDay(d, todayRef)
      }).sort(byPriority),
      upcoming: pool.filter((m) => {
        const d = parseDueDate(m?.dueDate)
        return d && d > todayRef && !isSameDay(d, todayRef) && m.status !== 'Terminée'
      }).sort((a, b) => timeOf(a) - timeOf(b)),
      active: pool.filter((m) => m.status === 'En cours' || m.status === 'Bloquée').sort(byPriority),
      done: pool.filter((m) => m.status === 'Terminée').sort((a, b) => timeOf(b) - timeOf(a)),
    }
  }, [missions, onlyPriority])

  const todayCount = missions.filter((m) => {
    const d = parseDueDate(m?.dueDate)
    return d && isSameDay(d, today)
  }).length
  const enCours   = missions.filter((m) => m.status === 'En cours').length
  const terminees = missions.filter((m) => m.status === 'Terminée').length
  const bloquees  = missions.filter((m) => m.status === 'Bloquée').length

  const nextUrgent = useMemo(() =>
    missions
      .filter((m) => m.status !== 'Terminée' && (m.priority === 'Critique' || m.priority === 'Haute'))
      .sort((a, b) => (PRIORITY_ORDER[a.priority] || 9) - (PRIORITY_ORDER[b.priority] || 9))[0]
  , [missions])

  const firstName = (currentUser?.name || '').split(' ')[0]
  const dateLabel = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const openMission = (id) => navigate('/missions/' + id)
  const findIntervention = (m) => (m.interventionId ? interventions.find((iv) => iv.id === m.interventionId) : null)

  const TABS = [
    { key: 'today', label: "Aujourd'hui", count: missionLists.today.length },
    { key: 'upcoming', label: 'À venir', count: missionLists.upcoming.length },
    { key: 'active', label: 'En cours', count: missionLists.active.length },
    { key: 'done', label: 'Terminées', count: missionLists.done.length },
    { key: 'calendar', label: 'Calendrier' },
  ]
  const EMPTY_MESSAGES = {
    today: "Aucune mission planifiée pour aujourd'hui.",
    upcoming: 'Aucune mission à venir.',
    active: 'Aucune mission en cours ou bloquée.',
    done: 'Aucune mission terminée pour le moment.',
  }
  const KPIS = [
    { label: "Aujourd'hui", value: todayCount, tab: 'today' },
    { label: 'En cours', value: enCours, tab: 'active' },
    { label: 'Bloquées', value: bloquees, tab: 'active' },
    { label: 'Terminées', value: terminees, tab: 'done' },
  ]
  const visibleMissions = activeTab === 'calendar' ? [] : missionLists[activeTab]

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-8 pt-4 sm:px-6 lg:pt-6">

        {/* ═══ Résumé du jour ═══ */}
        <section aria-labelledby="tech-greeting" className="rounded-3xl bg-brand-700 p-5 text-white shadow-lg shadow-brand-700/20 sm:p-6">
          <p className="text-xs font-semibold capitalize text-white/70">{dateLabel}</p>
          <h1 id="tech-greeting" className="mt-1 text-balance font-display text-2xl font-bold leading-tight">
            Bonjour{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-white/80">
            {todayCount === 0
              ? "Aucune mission prévue aujourd'hui."
              : `${todayCount} mission${todayCount > 1 ? 's' : ''} prévue${todayCount > 1 ? 's' : ''} aujourd'hui.`}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {KPIS.map(({ label, value, tab }) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-white/10 px-3 py-2.5 text-left transition active:scale-95 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span className="font-display text-xl font-bold leading-none">{value}</span>
                <span className="min-w-0 truncate text-xs font-medium text-white/80">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ═══ Mission prioritaire ═══ */}
        {nextUrgent && (
          <section aria-labelledby="tech-priority" className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white">
                <Zap size={14} aria-hidden="true" />
              </span>
              <h2 id="tech-priority" className="text-xs font-bold uppercase tracking-wider text-red-600">À traiter en priorité</h2>
              <span className="ml-auto"><StatusBadge status={nextUrgent.status} spin /></span>
            </div>
            <p className="mt-3 text-pretty text-base font-bold leading-snug text-slate-900">{nextUrgent.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              {[nextUrgent.site, formatDueLabel(nextUrgent)].filter(Boolean).join(' · ')}
            </p>
            <button
              type="button"
              onClick={() => openMission(nextUrgent.id)}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-1 rounded-xl bg-slate-900 text-sm font-bold text-white transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 sm:w-auto sm:px-5"
            >
              Voir la mission <ChevronRight size={16} aria-hidden="true" />
            </button>
          </section>
        )}

        {/* ═══ Onglets ═══ */}
        <section aria-label="Mes missions" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-slate-900">Mes missions</h2>
            <button
              type="button"
              aria-pressed={onlyPriority}
              onClick={() => setOnlyPriority((v) => !v)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                onlyPriority ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <Zap size={13} aria-hidden="true" /> Prioritaires
            </button>
          </div>

          <div role="tablist" aria-label="Filtrer les missions" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none]">
            {TABS.map(({ key, label, count }) => {
              const selected = activeTab === key
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(key)}
                  className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                    selected ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {key === 'calendar' && <CalendarDays size={15} aria-hidden="true" />}
                  {label}
                  {typeof count === 'number' && (
                    <span className={`rounded-full px-1.5 text-[11px] font-bold ${selected ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div role="tabpanel">
            {activeTab === 'calendar' ? (
              <MissionCalendar missions={missions} interventions={interventions} onOpen={openMission} />
            ) : visibleMissions.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
                <CalendarDays size={28} className="text-slate-300" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-slate-600">{EMPTY_MESSAGES[activeTab]}</p>
                {onlyPriority && (
                  <button type="button" onClick={() => setOnlyPriority(false)} className="mt-3 text-sm font-bold text-brand-600">
                    Afficher toutes les priorités
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {visibleMissions.map((m) => (
                  <MissionCard
                    key={m.id}
                    mission={m}
                    intervention={findIntervention(m)}
                    onStatusChange={handleStatusChange}
                    onOpen={openMission}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
