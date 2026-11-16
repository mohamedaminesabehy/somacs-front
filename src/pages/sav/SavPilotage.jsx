import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { AlertTriangle, CalendarDays, Clock, Gauge } from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import PageHeader from '../../components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { EmptyState, InlineAlert, SkeletonLines } from '../../components/ui/Feedback'
import StatusBadge from '../../components/ui/StatusBadge'
import MissionTable from '../../components/mission/MissionTable'
import MissionCalendar from './MissionCalendar'
import { dateKey } from './calendarDates.mjs'

const TABS = [
  { key: 'planning', label: 'Planning techniciens', icon: CalendarDays },
  { key: 'overdue', label: 'Missions en retard', icon: AlertTriangle },
]
const PRIORITIES = ['', 'Basse', 'Normale', 'Haute', 'Urgente']
const STATUSES = ['', 'À faire', 'En cours', 'Bloquée', 'Terminée', 'Annulée']

function formatOverdue(minutes) {
  if (!minutes) return '—'
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  return days > 0 ? `${days} j ${hours} h` : `${hours} h ${minutes % 60} min`
}

async function fetchSav(path) {
  const response = await apiFetch(path, { noCache: true })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(Array.isArray(body?.message) ? body.message.join(', ') : body?.message || `HTTP ${response.status}`)
  }
  return response.json()
}

function useSavResource(path) {
  const { data, error, isLoading, mutate } = useSWR(path, fetchSav, { revalidateOnFocus: true })
  useEffect(() => {
    const refresh = () => { void mutate() }
    window.addEventListener('mission:live-update', refresh)
    window.addEventListener('mission:saved', refresh)
    return () => {
      window.removeEventListener('mission:live-update', refresh)
      window.removeEventListener('mission:saved', refresh)
    }
  }, [mutate])
  return { data, error: error?.message, loading: isLoading, retry: () => mutate() }
}

function buildQuery(filters, extra = {}) {
  const params = new URLSearchParams()
  Object.entries({ ...filters, ...extra }).forEach(([k, v]) => {
    if (v !== '' && v != null) params.set(k, String(v))
  })
  return params.size ? `?${params}` : ''
}

export default function SavPilotage({ currentUser }) {
  const isTechnician = String(currentUser?.role || '').toLowerCase() === 'technicien'
  const [tab, setTab] = useState('planning')
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', priority: '', status: '', technicianId: '', department: '' })
  const technicians = useSavResource(isTechnician ? null : '/sav/technicians')
  const technicianOptions = technicians.data ?? []
  const departments = useMemo(() => Array.from(new Set((technicians.data || []).map(t => t.department).filter(Boolean))), [technicians.data])
  const setFilter = key => e => setFilters(f => ({ ...f, [key]: e.target.value }))
  const invalidRange = filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo
  return (
    <main className="ui-page flex min-w-0 flex-col gap-5">
      <PageHeader eyebrow="Planification & équipes" title="Pilotage SAV" description="Planifiez les missions et suivez vos équipes, au même endroit." icon={Gauge} breadcrumbs={[{ label: 'Pilotage' }, { label: 'SAV' }]} />
      <div role="tablist" aria-label="Vues de pilotage" className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => <button key={key} id={`sav-tab-${key}`} aria-controls={`sav-panel-${key}`} role="tab" type="button" aria-selected={tab === key} onClick={() => setTab(key)} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition-colors ${tab === key ? 'bg-navy text-white ring-navy' : 'bg-white text-ink-soft ring-line hover:bg-canvas'}`}><Icon size={16} aria-hidden="true" />{label}</button>)}
      </div>
      <Card><CardBody>
        <form className="grid grid-cols-2 gap-3 lg:grid-cols-6" onSubmit={e => e.preventDefault()}>
          <FilterField label="Du"><input type="date" value={filters.dateFrom} onChange={setFilter('dateFrom')} className="ui-input min-w-0" /></FilterField>
          <FilterField label="Au"><input type="date" value={filters.dateTo} onChange={setFilter('dateTo')} className="ui-input min-w-0" /></FilterField>
          <FilterField label="Priorité"><select value={filters.priority} onChange={setFilter('priority')} className="ui-select">{PRIORITIES.map(p => <option key={p} value={p}>{p || 'Toutes'}</option>)}</select></FilterField>
          <FilterField label="Statut"><select value={filters.status} onChange={setFilter('status')} className="ui-select">{STATUSES.map(s => <option key={s} value={s}>{s || 'Tous'}</option>)}</select></FilterField>
          {!isTechnician && <>
            <FilterField label="Technicien"><select value={filters.technicianId} onChange={setFilter('technicianId')} className="ui-select"><option value="">Tous</option>{technicianOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></FilterField>
            <FilterField label="Service"><select value={filters.department} onChange={setFilter('department')} className="ui-select"><option value="">Tous</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></FilterField>
          </>}
        </form>
        {invalidRange && <InlineAlert tone="warning" className="mt-3">La date de début doit précéder la date de fin.</InlineAlert>}
        {technicians.error && <InlineAlert tone="error" className="mt-3">{technicians.error}</InlineAlert>}
      </CardBody></Card>
      <div id={`sav-panel-${tab}`} role="tabpanel" aria-labelledby={`sav-tab-${tab}`} className="min-w-0">
        {!invalidRange && tab === 'planning' && <PlanningView filters={filters} currentUser={currentUser} />}
        {!invalidRange && tab === 'overdue' && <OverdueView filters={filters} />}
      </div>
    </main>
  )
}

function FilterField({ label, children }) {
  return <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-ink-muted">{label}{children}</label>
}

function PlanningView({ filters, currentUser }) {
  const [view, setView] = useState('month')
  const [date, setDate] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Tunis' }).format(new Date()))
  const panels = useRef(null)
  const { loading, error, data, retry } = useSavResource(`/sav/planning${buildQuery({ ...filters, dateFrom: '', dateTo: '' }, { view, date })}`)
  const missions = (data?.missions || []).filter(m => {
    const key = dateKey(m.dueDate)
    return key && (!filters.dateFrom || key >= filters.dateFrom) && (!filters.dateTo || key <= filters.dateTo)
  })
  return <div className="flex min-w-0 flex-col gap-4">
    {error && <InlineAlert tone="error">{error}<button type="button" onClick={retry} className="ml-3 underline">Réessayer</button></InlineAlert>}
    {(data?.conflicts || []).length > 0 && <InlineAlert tone="warning" title={`${data.conflicts.length} conflit(s) détecté(s)`}><ul className="list-disc pl-4">{data.conflicts.map((c, i) => <li key={i}>{c.date} {c.time || ''} — {c.label} (missions {c.missionIds.map(id => `#${id}`).join(', ')})</li>)}</ul></InlineAlert>}
    <MissionCalendar date={date} view={view} onDateChange={setDate} onViewChange={setView} missions={loading || error ? [] : missions} loading={loading || Boolean(error)} onSelect={m => panels.current?.openDetails(m)}>
      {loading && <div role="status" className="border-b border-line p-4"><span className="sr-only">Chargement du planning</span><SkeletonLines count={2} /></div>}
    </MissionCalendar>
    <MissionTable ref={panels} panelsOnly currentUser={currentUser} missions={missions} onMissionsChanged={retry} />
  </div>
}

function OverdueView({ filters }) {
  const [page, setPage] = useState(1)
  const filterKey = JSON.stringify(filters)
  useEffect(() => setPage(1), [filterKey])
  const { loading, error, data, retry } = useSavResource(`/sav/missions/overdue${buildQuery(filters, { page, limit: 20 })}`)
  if (loading) return <SkeletonLines count={6} />
  if (error) return <InlineAlert tone="error">{error}<button onClick={retry} className="ml-3 underline">Réessayer</button></InlineAlert>
  if (!data?.data?.length) return <EmptyState icon={Clock} title="Aucune mission en retard" description="Toutes les missions actives respectent leur échéance." />
  return <Card>
    <CardHeader title={`${data.total} mission(s) en retard`} subtitle="Échéance dépassée et mission non terminée" icon={AlertTriangle} />
    <CardBody><ul className="divide-y divide-line">{data.data.map(m => <li key={m.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><Link to={`/missions/${m.id}`} className="break-words text-sm font-semibold text-brand-700 hover:underline">#{m.id} · {m.title}</Link><p className="mt-1 text-xs text-ink-muted">{(m.team || []).map(t => t.name).filter(Boolean).join(', ') || 'Non renseigné'}</p></div>
      <div className="flex flex-wrap items-center gap-3"><StatusBadge status={m.status} /><span className="text-xs text-ink-muted">{m.priority}</span><span className="text-xs tabular-nums text-ink-soft">{m.dueDate} {m.dueTime || ''}</span><span className="text-xs font-semibold text-red-600">{formatOverdue(m.overdue?.overdueMinutes)}</span></div>
    </li>)}</ul>
    {data.totalPages > 1 && <nav aria-label="Pagination des retards" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><span>Page {data.page} / {data.totalPages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="ui-btn-secondary">Précédent</button><button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className="ui-btn-secondary">Suivant</button></div></nav>}
    </CardBody>
  </Card>
}
