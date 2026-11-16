import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  History,
  Stethoscope,
  TriangleAlert,
  Wrench,
} from 'lucide-react'
import { apiFetch, API_BASE_URL, getAuthToken } from '../../api/apiClient'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { EmptyState, InlineAlert, SkeletonLines } from '../ui/Feedback'

const TYPE_META = {
  intervention: { label: 'Interventions', icon: Wrench, tone: 'bg-brand-50 text-brand-700 ring-brand-100' },
  diagnostic: { label: 'Diagnostics', icon: Stethoscope, tone: 'bg-teal-50 text-teal-800 ring-teal-100' },
  panne: { label: 'Pannes', icon: TriangleAlert, tone: 'bg-red-50 text-red-700 ring-red-100' },
  reparation: { label: 'Réparations', icon: Wrench, tone: 'bg-amber-50 text-amber-800 ring-amber-100' },
  mission: { label: 'Missions', icon: ClipboardList, tone: 'bg-slate-100 text-slate-700 ring-slate-200' },
  action: { label: 'Actions', icon: Activity, tone: 'bg-canvas text-ink-muted ring-line' },
}

const PAGE_SIZE = 10

function formatDate(iso) {
  if (!iso) return 'Date inconnue'
  return new Intl.DateTimeFormat('fr-TN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Tunis',
  }).format(new Date(iso))
}

async function openInterventionPdf(interventionId) {
  const response = await fetch(`${API_BASE_URL}/interventions/${interventionId}/pdf`, {
    headers: { Authorization: `Bearer ${getAuthToken() ?? ''}` },
  })
  if (!response.ok) throw new Error('PDF indisponible')
  const url = URL.createObjectURL(await response.blob())
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export default function MachineTimeline({ machineId }) {
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [state, setState] = useState({ loading: true, error: null, data: null })
  const [pdfError, setPdfError] = useState(null)

  useEffect(() => {
    if (!machineId) return undefined
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (type) params.set('type', type)
    apiFetch(`/interventions/machine/${machineId}/timeline?${params}`, { noCache: true })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => !cancelled && setState({ loading: false, error: null, data }))
      .catch(() => !cancelled && setState({ loading: false, error: "Impossible de charger l'historique de la machine.", data: null }))
    return () => {
      cancelled = true
    }
  }, [machineId, type, page])

  const data = state.data
  const counts = data?.counts ?? {}
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0)

  const selectType = (next) => {
    setType(next)
    setPage(1)
  }

  return (
    <Card className="mt-6">
      <CardHeader
        title="Historique complet de la machine"
        subtitle={
          data?.technicians?.length
            ? `Techniciens intervenus : ${data.technicians.join(', ')}`
            : 'Interventions, diagnostics, pannes, réparations, missions et actions'
        }
        icon={History}
      />
      <CardBody>
        <div role="group" aria-label="Filtrer l'historique par type" className="flex flex-wrap gap-2">
          <FilterChip active={type === ''} onClick={() => selectType('')} label="Tout" count={totalAll} />
          {Object.entries(TYPE_META).map(([key, meta]) => (
            <FilterChip
              key={key}
              active={type === key}
              onClick={() => selectType(key)}
              label={meta.label}
              count={counts[key] ?? 0}
            />
          ))}
        </div>

        {pdfError && (
          <InlineAlert tone="error" className="mt-4">{pdfError}</InlineAlert>
        )}

        <div className="mt-5">
          {state.loading && <SkeletonLines count={5} />}
          {!state.loading && state.error && <InlineAlert tone="error">{state.error}</InlineAlert>}
          {!state.loading && !state.error && data?.data?.length === 0 && (
            <EmptyState
              icon={History}
              title="Aucun événement"
              description="Aucune donnée réellement liée à cette machine pour ce filtre."
            />
          )}
          {!state.loading && !state.error && data?.data?.length > 0 && (
            <ol className="relative flex flex-col gap-4 border-l border-line pl-6">
              {data.data.map((event) => {
                const meta = TYPE_META[event.type] ?? TYPE_META.action
                const Icon = meta.icon
                return (
                  <li key={event.key} className="relative">
                    <span
                      className={`absolute -left-[37px] flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white ${meta.tone}`}
                      aria-hidden="true"
                    >
                      <Icon size={14} />
                    </span>
                    <div className="rounded-xl border border-line bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-ink">{event.title}</p>
                        <time className="text-xs text-ink-muted" dateTime={event.date ?? undefined}>
                          {formatDate(event.date)}
                        </time>
                      </div>
                      {event.description && (
                        <p className="mt-1 text-sm text-ink-soft text-pretty">{event.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                        <span className={`rounded-full px-2 py-0.5 ring-1 ${meta.tone}`}>{meta.label.replace(/s$/, '')}</span>
                        {event.technician && <span>Technicien : {event.technician}</span>}
                        {event.status && <span>Statut : {event.status}</span>}
                        {event.interventionId && event.type === 'intervention' && (
                          <Link className="font-medium text-brand-700 hover:underline" to={`/interventions/${event.interventionId}`}>
                            Voir la fiche
                          </Link>
                        )}
                        {event.missionId && (
                          <Link className="font-medium text-brand-700 hover:underline" to={`/missions/${event.missionId}`}>
                            Voir la mission
                          </Link>
                        )}
                        {event.pdfAvailable && (
                          <button
                            type="button"
                            onClick={() => {
                              setPdfError(null)
                              openInterventionPdf(event.interventionId).catch(() =>
                                setPdfError('Le PDF de cette intervention est indisponible.'),
                              )
                            }}
                            className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
                          >
                            <FileText size={12} aria-hidden="true" /> PDF
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <nav aria-label="Pagination de l'historique" className="mt-5 flex items-center justify-between text-sm">
            <span className="text-ink-muted">
              Page {data.page} / {data.totalPages} · {data.total} événement(s)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={data.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-line px-3 disabled:opacity-40"
              >
                <ChevronLeft size={14} aria-hidden="true" /> Précédent
              </button>
              <button
                type="button"
                disabled={data.page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-line px-3 disabled:opacity-40"
              >
                Suivant <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          </nav>
        )}
      </CardBody>
    </Card>
  )
}

function FilterChip({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 transition-colors ${
        active ? 'bg-navy text-white ring-navy' : 'bg-white text-ink-soft ring-line hover:bg-canvas'
      }`}
    >
      {label}
      <span className={active ? 'text-white/70' : 'text-ink-faint'}>{count}</span>
    </button>
  )
}
