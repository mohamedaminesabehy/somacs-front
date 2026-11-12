import { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Plus, Calendar, Clock, CheckCircle2, AlertCircle, Layers,
  Wrench, RefreshCw, X, Trash2, SlidersHorizontal,
} from 'lucide-react'
import MissionTable from '../../components/mission/MissionTable'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { InlineAlert } from '../../components/ui/Feedback'
import { StatStrip, SearchField, SegmentedFilter, Toast } from '../../components/ui/DataKit'
import { useListMissionData } from './hooks/useListMissionData'
import { useMissionGrouping } from './hooks/useMissionGrouping'

function buildDeleteMissionSummary(mission) {
  const interventionId = String(mission?.interventionId || '').trim()
  const employeeName = String(mission?.employeeDisplay || mission?.employee || '').trim()

  if (!interventionId) {
    return {
      isLinked: false,
      title: 'Supprimer cette mission ?',
      message: 'Cette action est irréversible. La mission sera supprimée définitivement.',
      details: [],
    }
  }

  return {
    isLinked: true,
    title: 'Attention',
    message: `Cette mission est liée à l’intervention numéro ${interventionId}. En supprimant cette mission, l’intervention sera désaffectée et redeviendra non affectée.`,
    details: [
      `Technicien${employeeName ? `: ${employeeName}` : ''} ne sera plus assigné.`,
      'L’intervention liée sera remise à l’état non affecté.',
    ],
  }
}

/**
 * Returns a delta direction indicator: true for positive, false for negative, null for zero.
 */
function getDeltaDirection(value) {
  if (value > 0) return true
  if (value < 0) return false
  return null
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ListMission() {
  const navigate = useNavigate()
  const location = useLocation()
  const tableRef = useRef(null)

  const {
    missions, refreshMissions,
    toast, dismissToast,
    deleteDialog, setDeleteDialog, handleDeleteMission,
    highlightMissionId, highlightGroupId,
  } = useListMissionData({ location, navigate })

  const { groupedMissionRows } = useMissionGrouping(missions)

  const [search, setSearch]                 = useState('')
  const [filterEmployee, setFilterEmployee] = useState('all')
  const [filterStatus, setFilterStatus]     = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterType, setFilterType]         = useState('all')
  const [dateMode, setDateMode]             = useState('range')
  const [startDate, setStartDate]           = useState('')
  const [endDate, setEndDate]               = useState('')
  const [activeTab, setActiveTab]           = useState('all')


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

    return groupedMissionRows.filter((m) => {
      if (filterType !== 'all' && m.type !== filterType) return false
      if (filterEmployee !== 'all' && !String(m.employeeDisplay || m.employee || '').includes(filterEmployee)) return false
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
          m.employeeDisplay || m.employee,
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
  }, [groupedMissionRows, search, filterType, filterEmployee, filterPriority, dateMode, startDate, endDate, todayKey])

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
    const names = new Set()
    for (const mission of groupedMissionRows) {
      const grouped = String(mission.employeeDisplay || '').split(',').map((n) => n.trim()).filter(Boolean)
      if (grouped.length > 0) {
        grouped.forEach((name) => names.add(name))
      } else if (mission.employee) {
        names.add(mission.employee)
      }
    }
    return Array.from(names).sort()
  }, [groupedMissionRows])

  const interventionsLinkedCount = useMemo(() => {
    return groupedMissionRows.filter((m) => m.type === 'Intervention' && m.interventionId).length
  }, [groupedMissionRows])

  const kpis = useMemo(() => {
    const all = groupedMissionRows
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
        deltaUp: getDeltaDirection(todayDelta),
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
        deltaUp: getDeltaDirection(doneDelta),
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
  }, [groupedMissionRows, todayKey])

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

  const [showAdvanced, setShowAdvanced] = useState(false)
  const advancedCount = [
    filterEmployee !== 'all',
    filterPriority !== 'all',
    filterType !== 'all',
    dateMode === 'today' || startDate !== '' || endDate !== '',
  ].filter(Boolean).length

  const statusKeyByKpi = { inprogress: 'En cours', done: 'Terminée', blocked: 'Bloquée' }
  const kpiToneByKey = { today: 'brand', inprogress: 'amber', done: 'teal', blocked: 'red' }
  const stripItems = kpis.map((kpi) => ({
    key: kpi.key,
    label: kpi.label,
  hint: `${kpi.delta === '—' || kpi.delta === '!' ? '' : `${kpi.delta} `}${kpi.deltaLabel}`,
  hintTone: kpi.key === 'blocked' && kpi.value > 0 ? 'alert' : undefined,
    value: kpi.value,
    icon: kpi.icon,
    tone: kpiToneByKey[kpi.key],
    showShare: false,
  }))
  const activeStripKey = dateMode === 'today' && filterStatus === 'all'
    ? 'today'
    : Object.keys(statusKeyByKpi).find((key) => statusKeyByKpi[key] === filterStatus) || null

  const selectStrip = (key) => {
    if (!key) {
      setFilterStatus('all')
      setActiveTab('all')
      if (dateMode === 'today') setDateMode('range')
      return
    }
    if (key === 'today') {
      setDateMode('today')
      setFilterStatus('all')
      setActiveTab('all')
      return
    }
    setFilterStatus(statusKeyByKpi[key])
    setActiveTab(statusKeyByKpi[key])
  }

  const deleteSummary = deleteDialog.open ? buildDeleteMissionSummary(deleteDialog.mission) : null
  const closeDeleteDialog = () => {
    if (deleteDialog.isDeleting) return
    setDeleteDialog({ open: false, mission: null, isDeleting: false })
  }

  return (
    <div className="min-h-full bg-canvas">
      <Modal
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
        title={deleteSummary?.title || 'Supprimer cette mission ?'}
        description={deleteDialog.mission?.title}
        icon={deleteSummary?.isLinked ? AlertCircle : Trash2}
        size="md"
        footer={
          <>
            <button type="button" className="ui-btn-secondary" onClick={closeDeleteDialog} disabled={deleteDialog.isDeleting}>
              Annuler
            </button>
            <button
              type="button"
              disabled={deleteDialog.isDeleting || !deleteDialog.mission?.id}
              onClick={handleDeleteMission}
              className={deleteSummary?.isLinked ? 'ui-btn bg-amber-600 text-white hover:bg-amber-700' : 'ui-btn-danger'}
            >
              {deleteDialog.isDeleting ? <RefreshCw size={15} className="animate-spin" aria-hidden="true" /> : <Trash2 size={15} aria-hidden="true" />}
              {deleteDialog.isDeleting ? 'Suppression…' : 'Confirmer la suppression'}
            </button>
          </>
        }
      >
        {deleteSummary && (
          <InlineAlert tone={deleteSummary.isLinked ? 'warning' : 'info'} icon={deleteSummary.isLinked ? AlertCircle : undefined}>
            <p className="whitespace-pre-line">{deleteSummary.message}</p>
            {deleteSummary.details.length > 0 && (
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-4">
                {deleteSummary.details.map((detail) => <li key={detail}>{detail}</li>)}
              </ul>
            )}
          </InlineAlert>
        )}
      </Modal>

      <Toast toast={toast.open ? { type: 'success', message: toast.message } : null} onClose={dismissToast} />

      <div className="ui-page flex flex-col gap-5">
        <PageHeader
          eyebrow="Planification"
          title="Gestion des missions"
          description="Suivez, assignez et pilotez toutes les missions de votre équipe SAV."
          icon={Layers}
          actions={
            <>
              <button type="button" onClick={refreshMissions} className="ui-btn-secondary" aria-label="Actualiser les missions">
                <RefreshCw size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Actualiser</span>
              </button>
              <button type="button" onClick={() => navigate('/missions/assign')} className="ui-btn-primary">
                <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
                Affecter une mission
              </button>
            </>
          }
        />

        <StatStrip items={stripItems} activeKey={activeStripKey} onSelect={selectStrip} />

        <section className="ui-card overflow-hidden" aria-labelledby="missions-heading">
          <div className="flex flex-col gap-4 border-b border-line px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-2.5">
                <h2 id="missions-heading" className="font-display text-base font-bold text-ink">Toutes les missions</h2>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-ink-muted">{visibleMissions.length}</span>
                <span className="hidden items-center gap-1.5 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 sm:inline-flex">
                  <Wrench size={12} aria-hidden="true" /> {interventionsLinkedCount} SAV liées
                </span>
              </div>
              <div className="flex flex-1 items-center gap-2 lg:justify-end">
                <SearchField
                  value={search}
                  onChange={setSearch}
                  label="Rechercher une mission"
                  placeholder="Titre, technicien, site, n° intervention…"
                  className="flex-1 lg:max-w-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  aria-expanded={showAdvanced}
                  aria-controls="mission-advanced-filters"
                  className={`ui-btn border ${showAdvanced || advancedCount > 0 ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink-soft hover:bg-slate-50'}`}
                >
                  <SlidersHorizontal size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Filtres</span>
                  {advancedCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">{advancedCount}</span>
                  )}
                </button>
              </div>
            </div>

            {showAdvanced && (
              <div id="mission-advanced-filters" className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 animate-fade-up sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="filter-employee" className="ui-label">Technicien</label>
                  <select id="filter-employee" value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="ui-select">
                    <option value="all">Tous les techniciens</option>
                    {employeeOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-priority" className="ui-label">Priorité</label>
                  <select id="filter-priority" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="ui-select">
                    <option value="all">Toutes priorités</option>
                    <option value="Critique">Critique</option>
                    <option value="Haute">Haute</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Basse">Basse</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-type" className="ui-label">Type de mission</label>
                  <select id="filter-type" value={filterType} onChange={(e) => setFilterType(e.target.value)} className="ui-select">
                    <option value="all">Tous les types</option>
                    <option value="Normal">Normal</option>
                    <option value="Intervention">Intervention S.A.V</option>
                  </select>
                </div>
                <fieldset className="min-w-0">
                  <legend className="ui-label">Date de mission</legend>
                  <div className="flex gap-1 rounded-xl border border-line bg-white p-1">
                    {[{ value: 'today', label: "Aujourd'hui" }, { value: 'range', label: 'Période' }].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDateMode(option.value)}
                        aria-pressed={dateMode === option.value}
                        className={`h-8 flex-1 rounded-lg text-xs font-semibold transition-colors ${dateMode === option.value ? 'bg-navy text-white' : 'text-ink-muted hover:bg-slate-100'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                {dateMode === 'range' && (
                  <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-4 lg:max-w-md">
                    <div className="min-w-0">
                      <label htmlFor="filter-start" className="ui-label">Du</label>
                      <input id="filter-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ui-input" />
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="filter-end" className="ui-label">Au</label>
                      <input id="filter-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="ui-input" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <SegmentedFilter
                label="Statut des missions"
                value={activeTab}
                onChange={(key) => {
                  setActiveTab(key)
                  setFilterStatus(key === 'all' ? 'all' : key)
                }}
                options={statusTabs.map((tab) => ({ value: tab.key, label: tab.label, count: tab.count }))}
                className="flex-1"
              />
              {hasActiveFilters && (
                <button type="button" onClick={resetFilters} className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 sm:inline-flex">
                  <X size={13} aria-hidden="true" /> Réinitialiser
                </button>
              )}
            </div>
          </div>

          <MissionTable
            ref={tableRef}
            missions={visibleMissions}
            highlightMissionId={highlightMissionId}
            highlightAssignmentGroupId={highlightGroupId}
            onMissionsChanged={refreshMissions}
            onRequestDelete={(mission) => setDeleteDialog({ open: true, mission, isDeleting: false })}
          />
        </section>
      </div>
    </div>
  )
}
