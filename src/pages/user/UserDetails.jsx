import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Download, History, Loader2, RefreshCw, SearchX } from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import logoImage from '../../assets/logo-removebg-preview.png'
import {
  BUSINESS_ACTIONS,
  MODULE_SHORT_LABELS,
  MODULES,
  OPERATIONS,
  TECHNICIEN_ACTIONS,
  buildModuleInsights,
  countsFromStats,
  formatDateForDisplay,
  formatDateTime,
  formatDateToISO,
  getDescriptionLabel,
  getStartOfMonth,
  isValidDate,
  moduleFromLog,
  operationFromAction,
  operationTotals,
  totalFromCounts,
  ACTION_LABELS,
} from './audit/auditConfig'
import { buildTraceabilityPdf, loadImageAsDataUrl, traceabilityPdfFileName } from './audit/traceabilityPdf'
import ActivityFilters from './audit/ActivityFilters'
import {
  ActivityStats,
  ActivityTable,
  ActivityTimeline,
  EventDetailModal,
  ModuleInsights,
  PaginationBar,
} from './audit/ActivityViews'

const PAGE_SIZE = 15
const FETCH_LIMIT = 100
const MAX_FETCH_PAGES = 30

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function buildPeriodParams(start, end) {
  const params = new URLSearchParams()
  if (start) params.set('dateStart', start)
  if (end) params.set('dateEnd', end)
  return params
}

async function fetchAllLogs(userId, start, end) {
  const items = []
  let total = 0
  for (let page = 1; page <= MAX_FETCH_PAGES; page += 1) {
    const params = buildPeriodParams(start, end)
    params.set('page', String(page))
    params.set('limit', String(FETCH_LIMIT))
    const response = await apiFetch(`/audit-logs/user/${userId}?${params}`, { auth: true })
    if (!response.ok) throw new Error('logs')
    const data = await response.json()
    const batch = Array.isArray(data?.items) ? data.items : []
    items.push(...batch)
    total = Number(data?.total) || items.length
    const totalPages = Number(data?.totalPages) || 1
    if (page >= totalPages || batch.length === 0) break
  }
  return { items, total, truncated: total > items.length }
}

function UserSummary({ user }) {
  const facts = [
    { label: 'Rôle', value: user.role || '-' },
    { label: 'Département', value: user.department || '-' },
    { label: 'Identifiant', value: user.username || `#${user.id}` },
    { label: 'Dernière connexion', value: user.lastLogin ? formatDateTime(user.lastLogin) : 'Jamais' },
  ]
  return (
    <section aria-label="Utilisateur" className="ui-card flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 font-display text-lg font-bold text-white" aria-hidden="true">
          {initials(user.name)}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-display text-lg font-bold text-ink">{user.name}</h2>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${user.isActive ? 'bg-teal-50 text-teal-800 ring-teal-200' : 'bg-slate-100 text-ink-muted ring-slate-300'}`}>
              {user.isActive ? 'Compte actif' : 'Compte inactif'}
            </span>
          </div>
          <p className="truncate text-sm text-ink-muted">{user.email}</p>
        </div>
      </div>
      <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-xs text-ink-muted">{fact.label}</dt>
            <dd className="truncate text-sm font-semibold text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Chargement du journal">
      {[0, 1, 2, 3].map((n) => (
        <div key={n} className="ui-skeleton h-20 rounded-xl" />
      ))}
    </div>
  )
}

function EmptyState({ filtered, onClear }) {
  return (
    <div className="ui-card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        {filtered ? <SearchX size={22} aria-hidden="true" /> : <History size={22} aria-hidden="true" />}
      </span>
      <h3 className="font-display text-base font-semibold text-ink">
        {filtered ? 'Aucun événement ne correspond' : 'Aucune activité sur cette période'}
      </h3>
      <p className="max-w-sm text-pretty text-sm leading-relaxed text-ink-muted">
        {filtered
          ? 'Modifiez la recherche ou les filtres pour afficher davantage de résultats.'
          : "Cet utilisateur n'a enregistré aucune action métier entre les dates sélectionnées."}
      </p>
      {filtered && (
        <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={onClear}>Effacer les filtres</button>
      )}
    </div>
  )
}

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [userDetails, setUserDetails] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [pageError, setPageError] = useState('')

  const defaultStart = formatDateToISO(getStartOfMonth(new Date()))
  const defaultEnd = formatDateToISO(new Date())
  const [dateStart, setDateStart] = useState(defaultStart)
  const [dateEnd, setDateEnd] = useState(defaultEnd)
  const [period, setPeriod] = useState({ start: defaultStart, end: defaultEnd })
  const [activePreset, setActivePreset] = useState('month')
  const [dateError, setDateError] = useState('')

  const [logs, setLogs] = useState([])
  const [logsTruncated, setLogsTruncated] = useState(false)
  const [auditStats, setAuditStats] = useState(null)
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)
  const [auditError, setAuditError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [operationFilter, setOperationFilter] = useState('')
  const [view, setView] = useState('timeline')
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setIsLoadingUser(true)
    setPageError('')
    apiFetch(`/users/${id}`, { auth: true })
      .then(async (response) => {
        if (!response.ok) throw new Error('user')
        const data = await response.json()
        if (!cancelled) setUserDetails(data)
      })
      .catch(() => {
        if (!cancelled) setPageError("Impossible de charger les informations de l'utilisateur.")
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUser(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setIsLoadingAudit(true)
    setAuditError('')
    Promise.all([
      fetchAllLogs(id, period.start, period.end),
      apiFetch(`/audit-logs/user/${id}/stats?${buildPeriodParams(period.start, period.end)}`, { auth: true }).then((response) => {
        if (!response.ok) throw new Error('stats')
        return response.json()
      }),
    ])
      .then(([logsResult, stats]) => {
        if (cancelled) return
        setLogs(logsResult.items)
        setLogsTruncated(logsResult.truncated)
        setAuditStats(stats || null)
        setPage(1)
      })
      .catch(() => {
        if (!cancelled) setAuditError('Impossible de charger la traçabilité de cet utilisateur.')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAudit(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, period, refreshKey])

  const isTechnicien = userDetails?.role === 'Technicien'
  const allowedActions = isTechnicien ? TECHNICIEN_ACTIONS : BUSINESS_ACTIONS
  const counts = useMemo(() => countsFromStats(auditStats), [auditStats])
  const totalActions = totalFromCounts(counts, isTechnicien)
  const totals = useMemo(() => operationTotals(counts, isTechnicien), [counts, isTechnicien])
  const insights = useMemo(() => buildModuleInsights(counts, isTechnicien), [counts, isTechnicien])

  const visibleOperations = isTechnicien ? ['create', 'update', 'assign', 'ai'] : Object.keys(OPERATIONS)
  const visibleModules = isTechnicien ? MODULES.filter((key) => key !== 'Parc Machine') : MODULES

  const businessLogs = useMemo(() => logs.filter((log) => allowedActions.includes(log.action)), [logs, allowedActions])

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase()
    return businessLogs.filter((log) => {
      if (moduleFilter && moduleFromLog(log) !== moduleFilter) return false
      if (operationFilter && operationFromAction(log.action) !== operationFilter) return false
      if (!query) return true
      const haystack = [
        getDescriptionLabel(log.action, log.description),
        ACTION_LABELS[log.action],
        MODULE_SHORT_LABELS[moduleFromLog(log)],
        log.entityId != null ? `#${log.entityId}` : '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [businessLogs, search, moduleFilter, operationFilter])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasActiveFilters = Boolean(search || moduleFilter || operationFilter)

  const resetPageAnd = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setModuleFilter('')
    setOperationFilter('')
    setPage(1)
  }

  const applyPeriod = (start, end, presetKey = '') => {
    setDateError('')
    if (start && !isValidDate(start)) {
      setDateError('La date de début est invalide (format attendu : AAAA-MM-JJ, année entre 1753 et 9999).')
      return
    }
    if (end && !isValidDate(end)) {
      setDateError('La date de fin est invalide (format attendu : AAAA-MM-JJ, année entre 1753 et 9999).')
      return
    }
    if (start && end && start > end) {
      setDateError('La date de début doit être antérieure ou égale à la date de fin.')
      return
    }
    setDateStart(start)
    setDateEnd(end)
    setActivePreset(presetKey)
    setPeriod({ start, end })
  }

  const handlePreset = (preset) => {
    const [start, end] = preset.range(new Date())
    applyPeriod(formatDateToISO(start), formatDateToISO(end), preset.key)
  }

  const handleExportPdf = useCallback(async () => {
    if (!userDetails) return
    setIsExporting(true)
    setExportError('')
    try {
      const logoDataUrl = await loadImageAsDataUrl(logoImage).catch(() => '')
      const filterParts = []
      if (moduleFilter) filterParts.push(`Module : ${MODULE_SHORT_LABELS[moduleFilter] || moduleFilter}`)
      if (operationFilter) filterParts.push(`Opération : ${OPERATIONS[operationFilter].label}`)
      if (search.trim()) filterParts.push(`Recherche : « ${search.trim()} »`)
      const doc = buildTraceabilityPdf({
        user: userDetails,
        periodStart: period.start,
        periodEnd: period.end,
        counts,
        totalActions,
        isTechnicien,
        logs: filteredLogs,
        filtersLabel: filterParts.join(' · '),
        logoDataUrl,
      })
      doc.save(traceabilityPdfFileName(userDetails, period.start, period.end))
    } catch {
      setExportError("La génération du PDF a échoué. Réessayez dans un instant.")
    } finally {
      setIsExporting(false)
    }
  }, [userDetails, moduleFilter, operationFilter, search, period, counts, totalActions, isTechnicien, filteredLogs])

  if (isLoadingUser) {
    return (
      <div className="ui-page flex flex-col gap-6">
        <div className="ui-skeleton h-10 w-72 rounded-lg" />
        <div className="ui-skeleton h-28 rounded-2xl" />
        <LoadingState />
      </div>
    )
  }

  if (pageError || !userDetails) {
    return (
      <div className="ui-page flex flex-col items-start gap-4">
        <button type="button" className="ui-btn ui-btn-secondary" onClick={() => navigate('/users')}>
          <ArrowLeft size={16} aria-hidden="true" /> Retour aux utilisateurs
        </button>
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle size={16} aria-hidden="true" /> {pageError || 'Utilisateur introuvable.'}
        </p>
      </div>
    )
  }

  return (
    <div className="ui-page flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <button type="button" onClick={() => navigate('/users')} className="ui-icon-btn mt-1" aria-label="Retour aux utilisateurs">
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <div className="flex flex-col gap-1">
            <p className="ui-eyebrow">Utilisateurs · Traçabilité</p>
            <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-ink lg:text-3xl">Historique des activités</h1>
            <p className="text-sm text-ink-muted">
              {`Période du ${formatDateForDisplay(period.start)} au ${formatDateForDisplay(period.end)}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setRefreshKey((value) => value + 1)} disabled={isLoadingAudit}>
            <RefreshCw size={16} className={isLoadingAudit ? 'animate-spin' : ''} aria-hidden="true" /> Actualiser
          </button>
          <button type="button" className="ui-btn ui-btn-primary" onClick={handleExportPdf} disabled={isExporting || isLoadingAudit}>
            {isExporting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
            Exporter le rapport PDF
          </button>
        </div>
      </header>

      {exportError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{exportError}</p>
      )}

      <UserSummary user={userDetails} />

      <ActivityStats
        totals={totals}
        totalActions={totalActions}
        activeOperation={operationFilter}
        onSelectOperation={resetPageAnd(setOperationFilter)}
        visibleKeys={visibleOperations}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <ActivityFilters
            dateStart={dateStart}
            dateEnd={dateEnd}
            onDateStartChange={(event) => {
              setDateStart(event.target.value)
              setDateError('')
            }}
            onDateEndChange={(event) => {
              setDateEnd(event.target.value)
              setDateError('')
            }}
            onApplyDates={() => applyPeriod(dateStart, dateEnd)}
            onPreset={handlePreset}
            activePreset={activePreset}
            onReset={() => applyPeriod(defaultStart, defaultEnd, 'month')}
            dateError={dateError}
            search={search}
            onSearchChange={resetPageAnd(setSearch)}
            moduleFilter={moduleFilter}
            onModuleChange={resetPageAnd(setModuleFilter)}
            operationFilter={operationFilter}
            onOperationChange={resetPageAnd(setOperationFilter)}
            modules={visibleModules}
            operations={visibleOperations}
            view={view}
            onViewChange={setView}
            resultCount={filteredLogs.length}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />

          {logsTruncated && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {`Seuls les ${logs.length} événements les plus récents sont chargés. Réduisez la période pour un journal complet.`}
            </p>
          )}

          {auditError ? (
            <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle size={16} aria-hidden="true" /> {auditError}
            </p>
          ) : isLoadingAudit ? (
            <LoadingState />
          ) : pageLogs.length === 0 ? (
            <EmptyState filtered={hasActiveFilters} onClear={clearFilters} />
          ) : (
            <>
              {view === 'timeline' ? (
                <ActivityTimeline logs={pageLogs} onOpen={setSelectedLog} />
              ) : (
                <ActivityTable logs={pageLogs} onOpen={setSelectedLog} />
              )}
              <PaginationBar page={currentPage} totalPages={totalPages} total={filteredLogs.length} onChange={setPage} disabled={isLoadingAudit} />
            </>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <ModuleInsights insights={insights} />
        </aside>
      </div>

      <EventDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  )
}
