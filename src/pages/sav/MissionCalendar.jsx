import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { calendarDays, dateKey, shiftCalendarDate } from './calendarDates.mjs'

const tones = {
  'À faire': 'border-brand-200 bg-brand-50 text-brand-800',
  'En cours': 'border-amber-200 bg-amber-50 text-amber-900',
  'Terminée': 'border-teal-200 bg-teal-50 text-teal-900',
  'Bloquée': 'border-red-200 bg-red-50 text-red-800',
  'Annulée': 'border-slate-200 bg-slate-100 text-slate-600',
}
const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const displayDate = (key, options) => new Date(`${key}T12:00:00Z`).toLocaleDateString('fr-FR', { timeZone: 'UTC', ...options })

export default function MissionCalendar({ date, view, onDateChange, onViewChange, missions = [], onSelect, loading, children }) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Tunis' }).format(new Date())
  const days = calendarDays(date, view)
  const byDay = new Map()
  for (const mission of missions) {
    const key = dateKey(mission.dueDate)
    if (!key) continue
    byDay.set(key, [...(byDay.get(key) || []), mission])
  }
  const openDay = (key) => { onDateChange(key); onViewChange('day') }
  const title = view === 'month' ? displayDate(date, { month: 'long', year: 'numeric' })
    : view === 'day' ? displayDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : `${displayDate(days[0], { day: 'numeric', month: 'short' })} – ${displayDate(days.at(-1), { day: 'numeric', month: 'short', year: 'numeric' })}`
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-card" aria-label="Calendrier des techniciens" aria-busy={loading}>
      <header className="flex flex-col gap-4 border-b border-line p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden rounded-xl bg-brand-50 p-2.5 text-brand-700 sm:block"><CalendarDays size={21} aria-hidden="true" /></span>
            <div><h2 className="font-display text-lg font-bold capitalize text-ink">{title}</h2><p className="mt-0.5 text-xs text-ink-muted">{missions.length} mission(s) · Heure de Tunis</p></div>
          </div>
          <div role="group" aria-label="Vue du planning" className="flex rounded-xl bg-slate-100 p-1">
            {[['month', 'Mois'], ['week', 'Semaine'], ['day', 'Jour']].map(([key, label]) => <button key={key} type="button" aria-pressed={view === key} onClick={() => onViewChange(key)} className={`h-9 rounded-lg px-4 text-xs font-semibold transition-colors ${view === key ? 'bg-navy text-white shadow-sm' : 'text-ink-muted hover:bg-white'}`}>{label}</button>)}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Période précédente" onClick={() => onDateChange(shiftCalendarDate(date, view, -1))} className="ui-icon-btn h-10 w-10 border border-line"><ChevronLeft size={17} /></button>
            <button type="button" onClick={() => onDateChange(today)} className="ui-btn-secondary">Aujourd&apos;hui</button>
            <button type="button" aria-label="Période suivante" onClick={() => onDateChange(shiftCalendarDate(date, view, 1))} className="ui-icon-btn h-10 w-10 border border-line"><ChevronRight size={17} /></button>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-muted" aria-label="Légende des statuts">
            {Object.entries(tones).map(([status, tone]) => <span key={status} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full border ${tone}`} aria-hidden="true" />{status}</span>)}
          </div>
        </div>
      </header>
      {children}
      {view !== 'day' && <div className="grid grid-cols-7 border-b border-line bg-slate-50/70">{weekdays.map(day => <div key={day} className="py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-muted sm:text-xs">{day}</div>)}</div>}
      <div className={view === 'day' ? 'p-4 sm:p-5' : 'grid grid-cols-7'}>
        {days.map(key => {
          const entries = (byDay.get(key) || []).slice().sort((a, b) => (a.dueTime || '').localeCompare(b.dueTime || ''))
          const outside = view === 'month' && key.slice(0, 7) !== date.slice(0, 7)
          const limit = view === 'month' ? 2 : view === 'week' ? 4 : entries.length
          return <section key={key} aria-label={displayDate(key, { weekday: 'long', day: 'numeric', month: 'long' })} className={view === 'day' ? 'min-w-0' : `min-w-0 border-b border-r border-line p-1 last:border-r-0 sm:p-2 ${view === 'month' ? 'min-h-[112px] sm:min-h-[132px]' : 'min-h-[240px]'} ${outside ? 'bg-slate-50/70 text-ink-faint' : ''}`}>
            {view !== 'day' && <button type="button" onClick={() => openDay(key)} aria-label={`Afficher le ${displayDate(key, { day: 'numeric', month: 'long' })}`} aria-current={key === today ? 'date' : undefined} className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold sm:mb-2 ${key === today ? 'bg-brand-600 text-white' : 'hover:bg-brand-50'}`}>{Number(key.slice(-2))}</button>}
            <div className={`flex flex-col ${view === 'day' ? 'gap-3' : 'gap-1.5'}`}>
              {entries.slice(0, limit).map(m => <button key={m.id} type="button" disabled={loading} onClick={() => onSelect(m)} aria-label={`Détails mission #${m.id} ${m.title}`} title={[m.title, m.dueTime, ...(m.team || []).map(t => t.name)].filter(Boolean).join(' · ')} className={`min-w-0 overflow-hidden rounded-lg border text-left transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${tones[m.status] || tones['À faire']} ${view === 'day' ? 'p-4' : 'p-1 sm:p-2'}`}>
                <span className={`block truncate font-bold ${view === 'day' ? 'text-sm' : 'text-[10px] sm:text-xs'}`}>{m.dueTime && <span className="mr-1 hidden font-medium sm:inline">{m.dueTime}</span>}#{m.id}<span className={view === 'day' ? '' : 'hidden sm:inline'}> · {m.title}</span></span>
                <span className={`mt-1 block truncate ${view === 'day' ? 'text-xs' : 'text-[9px] sm:text-[11px]'}`}>{(m.team || []).map(t => t.name).filter(Boolean).join(', ') || 'Non renseigné'}</span>
                {view === 'day' && <span className="mt-2 block text-xs">{m.status} · {m.dueTime || 'Horaire non renseigné'}</span>}
              </button>)}
              {entries.length > limit && <button type="button" onClick={() => openDay(key)} className="rounded px-0.5 py-1 text-left text-[9px] font-semibold text-brand-700 hover:bg-brand-50 sm:text-xs">+ {entries.length - limit} autres</button>}
              {view === 'day' && !entries.length && !loading && <p className="py-12 text-center text-sm text-ink-muted">Aucune mission planifiée pour cette journée.</p>}
            </div>
          </section>
        })}
      </div>
      {!missions.length && !loading && view !== 'day' && <p className="px-4 py-4 text-center text-sm text-ink-muted">Aucune mission planifiée pour cette période et ces filtres.</p>}
    </section>
  )
}
