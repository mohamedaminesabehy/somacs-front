import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, ChevronLeft, ChevronRight, ExternalLink, Search } from 'lucide-react'
import { Card, CardBody } from '../../components/ui/Card'
import { EmptyState, InlineAlert, SkeletonLines } from '../../components/ui/Feedback'
import { fetchNotificationCenter, markNotificationRead } from '../../notifications/notificationsApi'
import { useNotifications } from '../../notifications/useNotifications'

const STATUS_TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'unread', label: 'Non lues' },
  { key: 'read', label: 'Lues' },
]

const TYPE_OPTIONS = [
  { key: '', label: 'Tous les types' },
  { key: 'mission', label: 'Missions' },
  { key: 'alert', label: 'Alertes' },
  { key: 'system', label: 'Système' },
]

const TYPE_LABELS = { mission: 'Mission', alert: 'Alerte', system: 'Système' }
const TYPE_TONES = {
  mission: 'bg-brand-600/10 text-brand-700',
  alert: 'bg-amber-100 text-amber-800',
  system: 'bg-slate-100 text-slate-700',
}

const PAGE_SIZE = 15

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Tunis',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getTargetLink(notification) {
  if (typeof notification.missionId === 'number') {
    return { to: `/missions/${notification.missionId}`, label: 'Ouvrir la mission' }
  }
  const text = `${notification.title || ''} ${notification.message || ''}`
  const intervention = text.match(/intervention[^0-9]*?(\d+)/i)
  if (intervention) return { to: `/interventions/${intervention[1]}`, label: "Ouvrir l'intervention" }
  return null
}

function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function NotificationsCenter() {
  const { notifications: liveNotifications, unreadCount, markAllRead } = useNotifications()
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounced(searchInput)
  const [page, setPage] = useState(1)
  const [state, setState] = useState({ loading: true, error: null, data: [], total: 0, totalPages: 1 })
  const [actionError, setActionError] = useState(null)
  const [markingAll, setMarkingAll] = useState(false)

  const latestLiveId = liveNotifications[0]?.id ?? null

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetchNotificationCenter({ page, limit: PAGE_SIZE, status, type, search, strict: true })
      setState({
        loading: false,
        error: null,
        data: res.data,
        total: res.total ?? 0,
        totalPages: Math.max(1, res.totalPages ?? Math.ceil((res.total ?? 0) / PAGE_SIZE)),
      })
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error: error.message }))
    }
  }, [page, status, type, search])

  // Reloads on filter change and whenever the socket pushes a new notification or read state changes.
  useEffect(() => {
    load()
  }, [load, latestLiveId, unreadCount])

  useEffect(() => {
    setPage(1)
  }, [status, type, search])

  async function handleMarkRead(id) {
    setActionError(null)
    const updated = await markNotificationRead(id)
    if (!updated) {
      setActionError('Impossible de marquer cette notification comme lue.')
      return
    }
    setState((s) => ({ ...s, data: s.data.map((n) => (n.id === id ? { ...n, isRead: true } : n)) }))
  }

  async function handleMarkAll() {
    setActionError(null)
    setMarkingAll(true)
    try {
      const ok = await markAllRead()
      if (ok === false) setActionError('Impossible de tout marquer comme lu.')
      await load()
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="ui-page flex flex-col gap-6">
      <header className="flex flex-col gap-5 animate-fade-up md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="flex min-w-0 items-start gap-4">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-white shadow-lift ui-blueprint sm:flex">
            <Bell size={22} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <p className="ui-eyebrow leading-none text-brand-700">Communication</p>
            <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-ink text-balance sm:text-[28px]">
              Centre de notifications
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-ink-muted text-pretty">
              Toutes vos notifications personnelles, mises à jour en temps réel.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleMarkAll}
          disabled={markingAll || unreadCount === 0}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 md:self-center"
        >
          <CheckCheck className="h-4 w-4" aria-hidden="true" />
          Tout marquer comme lu
        </button>
      </header>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div role="tablist" aria-label="Statut de lecture" className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={status === tab.key}
                  onClick={() => setStatus(tab.key)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition lg:flex-none ${
                    status === tab.key ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                  {tab.key === 'unread' && unreadCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 text-xs text-white">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Rechercher une notification</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 sm:w-64"
                />
              </label>
              <label>
                <span className="sr-only">Filtrer par type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {actionError && <InlineAlert tone="error" title="Action impossible">{actionError}</InlineAlert>}
          {state.error && (
            <InlineAlert tone="error" title="Erreur de chargement">
              {state.error}{' '}
              <button type="button" onClick={load} className="font-semibold underline">Réessayer</button>
            </InlineAlert>
          )}

          {state.loading && state.data.length === 0 ? (
            <SkeletonLines count={6} />
          ) : !state.error && state.data.length === 0 ? (
            <EmptyState icon={Bell} title="Aucune notification" description="Aucune notification ne correspond à ces filtres." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100" aria-busy={state.loading}>
              {state.data.map((n) => {
                const target = getTargetLink(n)
                return (
                  <li key={n.id} className={`flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-4 ${n.isRead ? '' : 'bg-brand-600/[0.03]'}`}>
                    <span
                      className={`mt-1.5 hidden h-2 w-2 shrink-0 rounded-full sm:block ${n.isRead ? 'bg-transparent' : 'bg-brand-600'}`}
                      aria-hidden="true"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${TYPE_TONES[n.type] || TYPE_TONES.system}`}>
                          {TYPE_LABELS[n.type] || 'Système'}
                        </span>
                        {!n.isRead && <span className="sr-only">Non lue</span>}
                        <time className="text-xs text-slate-500" dateTime={n.createdAt}>{formatDate(n.createdAt)}</time>
                      </div>
                      <p className={`text-sm ${n.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{n.title}</p>
                      <p className="text-sm leading-relaxed text-slate-600 text-pretty">{n.message}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {target && (
                        <Link
                          to={target.to}
                          onClick={() => !n.isRead && handleMarkRead(n.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-600/5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          {target.label}
                        </Link>
                      )}
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Marquer comme lu
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <nav aria-label="Pagination" className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
            <span className="text-slate-500">
              {state.total} notification{state.total > 1 ? 's' : ''} · page {page} / {state.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || state.loading}
                aria-label="Page précédente"
                className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(state.totalPages, p + 1))}
                disabled={page >= state.totalPages || state.loading}
                aria-label="Page suivante"
                className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        </CardBody>
      </Card>
    </div>
  )
}
