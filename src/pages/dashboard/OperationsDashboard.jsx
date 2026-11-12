import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  PlusCircle,
  Send,
  ShieldCheck,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react'
import { isSameMonthYear, parseDateLike, relativeDateLabel } from '../../utils/date'
import { useOperationsDashboardData } from './hooks/useOperationsDashboardData'
import { Donut, KpiTile, Legend, Panel, RankBars, SegmentedBar } from './components/DashboardWidgets'

const missionStatuses = ['À faire', 'En cours', 'Terminée', 'Bloquée']
const interventionStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'CLOSED']

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const MISSION_META = {
  'À faire': { label: 'À faire', tone: 'bg-brand-300', hex: '#93C5FD' },
  'En cours': { label: 'En cours', tone: 'bg-brand-600', hex: '#2563EB' },
  Terminée: { label: 'Terminées', tone: 'bg-teal-500', hex: '#14B8A6' },
  Bloquée: { label: 'Bloquées', tone: 'bg-red-500', hex: '#EF4444' },
}

const INTERVENTION_META = {
  PENDING: { label: 'En attente', tone: 'bg-slate-300', hex: '#CBD5E1' },
  ASSIGNED: { label: 'Affectées', tone: 'bg-brand-300', hex: '#93C5FD' },
  IN_PROGRESS: { label: 'En cours', tone: 'bg-brand-600', hex: '#2563EB' },
  CLOSED: { label: 'Clôturées', tone: 'bg-teal-500', hex: '#14B8A6' },
}

const ACTIVITY_KIND = {
  mission: { label: 'Mission', icon: ClipboardList, tone: 'bg-brand-50 text-brand-700 ring-brand-100' },
  intervention: { label: 'Intervention', icon: Wrench, tone: 'bg-amber-50 text-amber-700 ring-amber-100' },
  machine: { label: 'Machine', icon: FileText, tone: 'bg-canvas text-ink-muted ring-line' },
}

const ACTIVITY_PAGE_SIZE = 5

const QUICK_ACTIONS = [
  { label: 'Affecter une mission', hint: 'Planifier une intervention terrain', to: '/missions/assign', icon: Send },
  { label: 'Nouveau dossier SAV', hint: 'Créer une fiche d’intervention', to: '/interventions/create', icon: PlusCircle },
  { label: 'Gérer l’équipe', hint: 'Utilisateurs et accès', to: '/users', icon: UserPlus },
]

function greeting(date) {
  const hour = date.getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default function OperationsDashboard({ currentUser }) {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [activityPage, setActivityPage] = useState(1)

  const { isLoading, users, missions, interventions, machines } = useOperationsDashboardData()

  const yearOptions = useMemo(() => {
    const years = new Set()
    const addYear = (value) => {
      const d = parseDateLike(value)
      if (d instanceof Date && !Number.isNaN(d.getTime())) years.add(d.getFullYear())
    }
    missions.forEach((m) => addYear(m?.dueDate || m?.updatedAt || m?.createdAt))
    interventions.forEach((itv) => addYear(itv?.date || itv?.interventionDate || itv?.updatedAt || itv?.createdAt))
    machines.forEach((m) => addYear(m?.updatedAt || m?.createdAt || m?.receptionDate))
    years.add(today.getFullYear())
    years.add(selectedYear)
    if (years.size <= 1) {
      const base = today.getFullYear()
      for (let i = base - 2; i <= base + 1; i += 1) years.add(i)
    }
    return Array.from(years).sort((a, b) => b - a)
  }, [missions, interventions, machines, today, selectedYear])

  const filteredMissions = useMemo(() =>
    missions.filter((m) => isSameMonthYear(parseDateLike(m?.dueDate || m?.updatedAt || m?.createdAt), selectedMonth, selectedYear)),
  [missions, selectedMonth, selectedYear])

  const filteredInterventions = useMemo(() =>
    interventions.filter((itv) => isSameMonthYear(parseDateLike(itv?.date || itv?.interventionDate || itv?.updatedAt || itv?.createdAt), selectedMonth, selectedYear)),
  [interventions, selectedMonth, selectedYear])

  const filteredMachines = useMemo(() =>
    machines.filter((m) => isSameMonthYear(parseDateLike(m?.updatedAt || m?.createdAt || m?.receptionDate), selectedMonth, selectedYear)),
  [machines, selectedMonth, selectedYear])

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
    const unassignedInterventions = filteredInterventions.filter((itv) => {
      const status = String(itv?.status || '').trim()
      const hasAgent = Boolean(String(itv?.assignee || itv?.assignedTo || itv?.technicianName || '').trim())
      return status !== 'CLOSED' && !hasAgent
    }).length
    const machinesWithoutDocs = Math.max(machines.length - machinesWithDocs, 0)

    const alerts = [
      { key: 'unassigned', title: 'Interventions non affectées', value: unassignedInterventions, severity: unassignedInterventions > 0 ? 'medium' : 'low', to: '/interventions' },
      { key: 'blocked', title: 'Missions bloquées', value: missionCounts.Bloquée, severity: missionCounts.Bloquée > 0 ? 'high' : 'low', to: '/missions' },
      { key: 'docs', title: 'Machines sans documentation', value: machinesWithoutDocs, severity: machinesWithoutDocs > 0 ? 'medium' : 'low', to: '/machines' },
    ]

    return { activeUsers, missionCounts, missionOpen, interventionCounts, interventionOpen, highPriorityInterventions, machinesWithDocs, alerts }
  }, [users, machines, filteredMissions, filteredInterventions])

  const missionRows = missionStatuses.map((status) => ({ key: status, count: analytics.missionCounts[status] || 0, ...MISSION_META[status] }))
  const interventionRows = interventionStatuses.map((status) => ({ key: status, count: analytics.interventionCounts[status] || 0, ...INTERVENTION_META[status] }))
  const completionRate = filteredMissions.length ? Math.round(((analytics.missionCounts.Terminée || 0) / filteredMissions.length) * 100) : 0
  const docPct = machines.length ? Math.round((analytics.machinesWithDocs / machines.length) * 100) : 0
  const pendingAlerts = analytics.alerts.filter((a) => a.value > 0).length

  const closedByEmployee = useMemo(() => {
    const counts = new Map()
    for (const m of filteredMissions) {
      if (String(m?.status || '').trim() !== 'Terminée') continue
      const id = m?.employeeUserId != null ? Number(m.employeeUserId) : null
      const name = String(m?.employee || '').trim()
      const key = id != null && !Number.isNaN(id) ? `id:${id}` : name || 'Sans employé'
      const label = name || (id != null && !Number.isNaN(id) ? `Employé #${id}` : 'Sans employé')
      const prev = counts.get(key) || { key, label, value: 0 }
      counts.set(key, { ...prev, value: prev.value + 1 })
    }
    return Array.from(counts.values()).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [filteredMissions])

  const recentActivity = useMemo(() => {
    const missionItems = filteredMissions.slice(0, 12).map((m) => ({
      id: `mission-${m?.id}`, kind: 'mission', to: m?.id ? `/missions/${m.id}` : null,
      title: m?.title || `Mission #${m?.id || ''}`, status: m?.status || 'À faire',
      date: parseDateLike(m?.dueDate || m?.updatedAt || m?.createdAt), rawDate: m?.dueDate || m?.updatedAt || m?.createdAt,
      meta: m?.employee || 'Aucun technicien',
    }))
    const interventionItems = filteredInterventions.slice(0, 12).map((itv) => ({
      id: `intervention-${itv?.id}`, kind: 'intervention', to: itv?.id ? `/interventions/${itv.id}` : null,
      title: `Intervention ${itv?.id || ''}`, status: INTERVENTION_META[itv?.status]?.label || itv?.status || 'En attente',
      date: parseDateLike(itv?.date || itv?.interventionDate), rawDate: itv?.date || itv?.interventionDate,
      meta: itv?.client || itv?.clientName || 'Client non précisé',
    }))
    const machineItems = filteredMachines.slice(0, 10).map((m) => ({
      id: `machine-${m?.id}`, kind: 'machine', to: m?.id ? `/machines/${m.id}` : null,
      title: m?.designation || `Machine ${m?.code || ''}`, status: m?.status || 'Actif',
      date: parseDateLike(m?.updatedAt || m?.createdAt || m?.receptionDate), rawDate: m?.updatedAt || m?.createdAt || m?.receptionDate,
      meta: m?.supplier || 'Sans fournisseur',
    }))
    return [...missionItems, ...interventionItems, ...machineItems]
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
      .slice(0, 20)
  }, [filteredMissions, filteredInterventions, filteredMachines])

  const activityPages = Math.max(1, Math.ceil(recentActivity.length / ACTIVITY_PAGE_SIZE))
  const safeActivityPage = Math.min(activityPage, activityPages)
  const activitySlice = recentActivity.slice((safeActivityPage - 1) * ACTIVITY_PAGE_SIZE, safeActivityPage * ACTIVITY_PAGE_SIZE)

  const shiftMonth = (delta) => {
    const next = new Date(selectedYear, selectedMonth + delta, 1)
    setSelectedMonth(next.getMonth())
    setSelectedYear(next.getFullYear())
    setActivityPage(1)
  }

  const firstName = String(currentUser?.name || currentUser?.username || '').split(' ')[0]

  return (
    <div className="ui-page flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl bg-navy text-white shadow-raised animate-fade-up">
        <div className="ui-blueprint absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">Centre de pilotage</p>
            <h1 className="font-display text-2xl font-extrabold text-balance sm:text-3xl">
              {greeting(today)}{firstName ? `, ${firstName}` : ''}.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-white/70">
              {isLoading
                ? 'Chargement des indicateurs opérationnels…'
                : `${analytics.missionOpen} mission(s) ouverte(s) et ${analytics.interventionOpen} intervention(s) en cours de traitement sur ${MONTHS_FR[selectedMonth].toLowerCase()} ${selectedYear}.`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1 ring-1 ring-inset ring-white/15">
              <button type="button" onClick={() => shiftMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white" aria-label="Mois précédent">
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <label className="sr-only" htmlFor="dashboard-month">Mois</label>
              <div className="flex items-center gap-2 px-1">
                <CalendarDays size={15} className="text-brand-200" aria-hidden="true" />
                <select id="dashboard-month" value={selectedMonth} onChange={(e) => { setSelectedMonth(Number(e.target.value)); setActivityPage(1) }} className="cursor-pointer bg-transparent text-sm font-semibold text-white focus:outline-none [&>option]:text-ink">
                  {MONTHS_FR.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <label className="sr-only" htmlFor="dashboard-year">Année</label>
                <select id="dashboard-year" value={selectedYear} onChange={(e) => { setSelectedYear(Number(e.target.value)); setActivityPage(1) }} className="cursor-pointer bg-transparent text-sm font-semibold text-white focus:outline-none [&>option]:text-ink">
                  {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button type="button" onClick={() => shiftMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white" aria-label="Mois suivant">
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
            <button type="button" onClick={() => navigate('/missions/assign')} className="ui-btn bg-white text-navy hover:bg-brand-50">
              <Send size={15} aria-hidden="true" />
              Affecter une mission
            </button>
          </div>
        </div>

        <dl className="relative grid grid-cols-2 border-t border-white/10 md:grid-cols-4">
          {[
            { label: 'Taux de clôture', value: `${completionRate}%` },
            { label: 'Missions du mois', value: filteredMissions.length },
            { label: 'Parc machines', value: machines.length },
            { label: 'Alertes actives', value: pendingAlerts },
          ].map((item, index) => (
            <div key={item.label} className={`flex flex-col gap-0.5 px-5 py-4 sm:px-7 ${index % 2 === 1 ? 'border-l border-white/10' : ''} ${index >= 2 ? 'border-t border-white/10 md:border-t-0 md:border-l' : ''}`}>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-white/55">{item.label}</dt>
              <dd className="font-display text-xl font-bold tabular-nums">{isLoading ? '—' : item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Indicateurs clés" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Missions ouvertes" value={analytics.missionOpen} detail={`${analytics.missionCounts['En cours'] || 0} en cours · ${analytics.missionCounts['À faire'] || 0} à faire`} icon={ClipboardList} tone="brand" ratio={filteredMissions.length ? (analytics.missionOpen / filteredMissions.length) * 100 : 0} isLoading={isLoading} onClick={() => navigate('/missions')} />
        <KpiTile label="Interventions actives" value={analytics.interventionOpen} detail={`${analytics.interventionCounts.CLOSED || 0} clôturée(s) ce mois`} icon={Wrench} tone="amber" ratio={filteredInterventions.length ? (analytics.interventionOpen / filteredInterventions.length) * 100 : 0} isLoading={isLoading} onClick={() => navigate('/interventions')} />
        <KpiTile label="Priorité haute" value={analytics.highPriorityInterventions} detail="Interventions critiques ou hautes" icon={AlertTriangle} tone="red" isLoading={isLoading} />
        <KpiTile label="Utilisateurs actifs" value={analytics.activeUsers} detail={`${users.length} compte(s) au total`} icon={Users} tone="teal" ratio={users.length ? (analytics.activeUsers / users.length) * 100 : 0} isLoading={isLoading} />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Panel title="Pipeline des missions" subtitle={`Répartition par statut — ${MONTHS_FR[selectedMonth]} ${selectedYear}`} action={<span className="ui-badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">{filteredMissions.length} au total</span>}>
            <SegmentedBar rows={missionRows} total={filteredMissions.length} />
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {missionRows.map((row) => (
                <div key={row.key} className="flex flex-col gap-2 rounded-xl border border-line bg-canvas/60 p-4">
                  <span className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
                    <span className={`h-2 w-2 rounded-full ${row.tone}`} aria-hidden="true" />
                    {row.label}
                  </span>
                  <span className="font-display text-2xl font-extrabold tabular-nums text-ink">{isLoading ? '—' : row.count}</span>
                  <span className="text-[11px] text-ink-faint">{filteredMissions.length ? Math.round((row.count / filteredMissions.length) * 100) : 0}% du mois</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Panel title="Interventions par statut" subtitle="Suivi du flux SAV">
              <div className="flex flex-col items-center gap-5 sm:flex-row md:flex-col lg:flex-row">
                <Donut rows={interventionRows} total={filteredInterventions.length} centerLabel="ce mois" />
                <div className="w-full"><Legend rows={interventionRows} /></div>
              </div>
            </Panel>

            <Panel title="Missions clôturées" subtitle="Classement des techniciens">
              {closedByEmployee.length ? (
                <RankBars items={closedByEmployee} />
              ) : (
                <EmptyInline icon={CheckCircle2} text="Aucune mission clôturée sur la période." />
              )}
            </Panel>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Points d’attention" subtitle="À traiter en priorité">
            <ul className="flex flex-col gap-2">
              {analytics.alerts.map((alert) => {
                const tone = alert.severity === 'high' ? 'bg-red-50 text-red-700 ring-red-100' : alert.severity === 'medium' ? 'bg-amber-50 text-amber-700 ring-amber-100' : 'bg-teal-50 text-teal-700 ring-teal-100'
                return (
                  <li key={alert.key}>
                    <button type="button" onClick={() => navigate(alert.to)} className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left transition hover:border-brand-200 hover:bg-brand-50/40">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${tone}`}>
                        {alert.value > 0 ? <AlertTriangle size={16} aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-ink-soft">{alert.title}</span>
                      <span className="font-display text-lg font-bold tabular-nums text-ink">{isLoading ? '—' : alert.value}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel title="Documentation du parc" subtitle="Machines avec documents techniques">
            <div className="flex items-end justify-between">
              <span className="font-display text-4xl font-extrabold tabular-nums text-ink">{docPct}%</span>
              <span className="text-xs text-ink-muted">{analytics.machinesWithDocs} / {machines.length} machines</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-canvas" aria-hidden="true">
              <div className="h-full rounded-full bg-brand-600 transition-all duration-700" style={{ width: `${docPct}%` }} />
            </div>
          </Panel>

          <Panel title="Actions rapides">
            <ul className="flex flex-col gap-2">
              {QUICK_ACTIONS.map((action) => (
                <li key={action.to}>
                  <button type="button" onClick={() => navigate(action.to)} className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-canvas">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                      <action.icon size={16} aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-semibold text-ink">{action.label}</span>
                      <span className="truncate text-xs text-ink-muted">{action.hint}</span>
                    </span>
                    <ChevronRight size={16} className="ml-auto shrink-0 text-ink-faint group-hover:text-brand-600" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel
        title="Activité récente"
        subtitle="Missions, interventions et machines de la période"
        action={activityPages > 1 && (
          <div className="flex items-center gap-1">
            <button type="button" className="ui-icon-btn" onClick={() => setActivityPage((p) => Math.max(1, p - 1))} disabled={safeActivityPage === 1} aria-label="Page précédente"><ChevronLeft size={16} aria-hidden="true" /></button>
            <span className="px-1 text-xs tabular-nums text-ink-muted">{safeActivityPage}/{activityPages}</span>
            <button type="button" className="ui-icon-btn" onClick={() => setActivityPage((p) => Math.min(activityPages, p + 1))} disabled={safeActivityPage === activityPages} aria-label="Page suivante"><ChevronRight size={16} aria-hidden="true" /></button>
          </div>
        )}
      >
        {isLoading ? (
          <div className="flex flex-col gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl ui-skeleton" />)}</div>
        ) : activitySlice.length ? (
          <ol className="relative flex flex-col">
            {activitySlice.map((item, index) => {
              const kind = ACTIVITY_KIND[item.kind]
              const Icon = kind.icon
              return (
                <li key={item.id} className="relative flex gap-4 pb-4 last:pb-0">
                  {index < activitySlice.length - 1 && <span className="absolute left-[17px] top-10 bottom-0 w-px bg-line" aria-hidden="true" />}
                  <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${kind.tone}`}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <button type="button" disabled={!item.to} onClick={() => item.to && navigate(item.to)} className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4 disabled:cursor-default">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
                      <span className="block truncate text-xs text-ink-muted">{kind.label} · {item.meta}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="ui-badge bg-canvas text-ink-soft ring-1 ring-inset ring-line">{item.status}</span>
                      <span className="text-xs tabular-nums text-ink-faint">{relativeDateLabel(item.rawDate)}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        ) : (
          <EmptyInline icon={Activity} text="Aucune activité enregistrée sur cette période." />
        )}
      </Panel>
    </div>
  )
}

function EmptyInline({ icon: Icon, text }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
      <Icon size={22} className="text-ink-faint" aria-hidden="true" />
      <p className="text-sm text-ink-muted">{text}</p>
    </div>
  )
}
