import { ChevronLeft, ChevronRight, Clock, Eye, Fingerprint, Globe, Hash, Layers } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import StatusBadge from '../../../components/ui/StatusBadge'
import {
  ACTION_LABELS,
  MODULE_SHORT_LABELS,
  OPERATIONS,
  dayKey,
  formatDateTime,
  formatDayHeading,
  formatTime,
  getDescriptionLabel,
  moduleFromLog,
  operationFromAction,
} from './auditConfig'

export function OperationBadge({ action }) {
  const op = OPERATIONS[operationFromAction(action)]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${op.soft}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${op.dot}`} aria-hidden="true" />
      {ACTION_LABELS[action] || action}
    </span>
  )
}

function moduleLabel(log) {
  const key = moduleFromLog(log)
  return MODULE_SHORT_LABELS[key] || key
}

/* ── Synthèse : total + répartition par opération en barre empilée ───────── */
export function ActivityStats({ totals, totalActions, activeOperation, onSelectOperation, visibleKeys }) {
  const keys = visibleKeys.filter((key) => OPERATIONS[key])
  return (
    <section aria-labelledby="stats-title" className="ui-card overflow-hidden">
      <div className="grid gap-px bg-line lg:grid-cols-[18rem_1fr]">
        <div className="flex flex-col justify-between gap-6 bg-navy p-5 text-white sm:p-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Activité sur la période</p>
            <h2 id="stats-title" className="sr-only">Statistiques</h2>
            <p className="font-display text-5xl font-bold tabular-nums leading-none">{totalActions}</p>
            <p className="text-sm text-brand-100">action{totalActions > 1 ? 's' : ''} métier enregistrée{totalActions > 1 ? 's' : ''}</p>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            {keys.map((key) => {
              const share = totalActions > 0 ? (totals[key] / totalActions) * 100 : 0
              return <span key={key} className={OPERATIONS[key].dot} style={{ width: `${share}%` }} />
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 xl:grid-cols-5">
          {keys.map((key) => {
            const op = OPERATIONS[key]
            const value = totals[key] || 0
            const share = totalActions > 0 ? Math.round((value / totalActions) * 100) : 0
            const active = activeOperation === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectOperation(active ? '' : key)}
                aria-pressed={active}
                className={`group flex flex-col gap-3 p-4 text-left transition-colors sm:p-5 ${active ? 'bg-brand-50' : 'bg-white hover:bg-canvas'}`}
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
                  <span className={`h-2 w-2 rounded-full ${op.dot}`} aria-hidden="true" />
                  {op.label}
                </span>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-2xl font-bold tabular-nums text-ink">{value}</span>
                  <span className="text-xs font-medium tabular-nums text-ink-faint">{share}%</span>
                </span>
                <span className={`text-xs font-medium ${active ? 'text-brand-700' : 'text-ink-faint group-hover:text-ink-muted'}`}>
                  {active ? 'Filtre actif' : 'Filtrer'}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── Constats par module ─────────────────────────────────────────────────── */
export function ModuleInsights({ insights }) {
  return (
    <section aria-labelledby="insights-title" className="ui-card flex flex-col">
      <div className="ui-card-header">
        <h2 id="insights-title" className="ui-card-title">Constats par module</h2>
      </div>
      <ul className="flex flex-col divide-y divide-line">
        {insights.map((insight) => (
          <li key={insight.key} className="flex flex-col gap-2 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink">{insight.title}</span>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold tabular-nums text-brand-700">{insight.value}</span>
            </div>
            <ul className="flex flex-col gap-1">
              {insight.lines.map((line) => (
                <li key={line} className="text-pretty text-sm leading-relaxed text-ink-muted">{line}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ── Timeline groupée par jour ───────────────────────────────────────────── */
export function ActivityTimeline({ logs, onOpen }) {
  const groups = []
  logs.forEach((log) => {
    const key = dayKey(log.createdAt)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.items.push(log)
    else groups.push({ key, items: [log] })
  })

  return (
    <ol className="flex flex-col gap-6">
      {groups.map((group) => (
        <li key={group.key} className="flex flex-col gap-3">
          <div className="sticky top-0 z-10 flex items-center gap-3 bg-canvas/95 py-1 backdrop-blur">
            <h3 className="text-sm font-semibold text-ink">{formatDayHeading(group.key)}</h3>
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
            <span className="text-xs font-medium text-ink-faint">{group.items.length} événement{group.items.length > 1 ? 's' : ''}</span>
          </div>
          <ol className="relative flex flex-col gap-2 border-l border-line pl-5 sm:ml-14 sm:pl-6">
            {group.items.map((log) => {
              const op = OPERATIONS[operationFromAction(log.action)]
              const failed = String(log.status || '').toUpperCase() === 'FAILED'
              return (
                <li key={log.id} className="relative">
                  <span className={`absolute -left-[1.6rem] top-4 h-3 w-3 rounded-full ring-4 ring-canvas sm:-left-[1.85rem] ${op.dot}`} aria-hidden="true" />
                  <span className="absolute -left-[5.5rem] top-3 hidden w-12 text-right text-xs font-semibold tabular-nums text-ink-muted sm:block">
                    {formatTime(log.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpen(log)}
                    className="group flex w-full flex-col gap-2 rounded-xl border border-line bg-white p-4 text-left shadow-card transition hover:border-brand-200 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <OperationBadge action={log.action} />
                      <span className="text-xs font-medium text-ink-muted">{moduleLabel(log)}</span>
                      {failed && <StatusBadge tone="red">Échec</StatusBadge>}
                      <span className="ml-auto text-xs font-semibold tabular-nums text-ink-muted sm:hidden">{formatTime(log.createdAt)}</span>
                    </span>
                    <span className="text-pretty text-sm leading-relaxed text-ink-soft">{getDescriptionLabel(log.action, log.description)}</span>
                    <span className="flex items-center justify-between gap-3 text-xs text-ink-faint">
                      <span className="font-mono">{log.entityId ? `Réf. #${log.entityId}` : 'Sans référence'}</span>
                      <span className="inline-flex items-center gap-1 font-medium text-brand-700 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                        <Eye size={14} aria-hidden="true" /> Détails
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </li>
      ))}
    </ol>
  )
}

/* ── Tableau professionnel ───────────────────────────────────────────────── */
export function ActivityTable({ logs, onOpen }) {
  return (
    <div className="ui-card overflow-x-auto">
      <table className="w-full min-w-[46rem] text-sm">
        <caption className="sr-only">Journal des opérations</caption>
        <thead>
          <tr className="border-b border-line bg-canvas text-left text-xs font-semibold text-ink-muted">
            <th scope="col" className="px-4 py-3">Date et heure</th>
            <th scope="col" className="px-4 py-3">Opération</th>
            <th scope="col" className="px-4 py-3">Module</th>
            <th scope="col" className="px-4 py-3">Description</th>
            <th scope="col" className="px-4 py-3 text-right">Réf.</th>
            <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {logs.map((log) => (
            <tr key={log.id} className="bg-white transition-colors hover:bg-brand-50/40">
              <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-soft">{formatDateTime(log.createdAt)}</td>
              <td className="px-4 py-3"><OperationBadge action={log.action} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{moduleLabel(log)}</td>
              <td className="max-w-md px-4 py-3 text-ink-soft"><span className="line-clamp-2">{getDescriptionLabel(log.action, log.description)}</span></td>
              <td className="px-4 py-3 text-right font-mono text-xs text-ink-faint">{log.entityId ? `#${log.entityId}` : '-'}</td>
              <td className="px-4 py-3 text-right">
                <button type="button" onClick={() => onOpen(log)} className="ui-icon-btn" aria-label={`Voir le détail de ${ACTION_LABELS[log.action] || log.action}`}>
                  <Eye size={16} aria-hidden="true" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Pagination serveur ──────────────────────────────────────────────────── */
export function PaginationBar({ page, totalPages, total, onChange, disabled }) {
  return (
    <nav aria-label="Pagination du journal" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-ink-muted">
        Page <span className="font-semibold text-ink">{page}</span> sur {totalPages}
        <span className="text-ink-faint">{` · ${total} événement${total > 1 ? 's' : ''} au total`}</span>
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => onChange(page - 1)} disabled={disabled || page <= 1}>
          <ChevronLeft size={16} aria-hidden="true" /> Précédent
        </button>
        <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => onChange(page + 1)} disabled={disabled || page >= totalPages}>
          Suivant <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

/* ── Modale de détail d'un événement ─────────────────────────────────────── */
function DataBlock({ title, data }) {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-ink-muted">{title}</p>
        <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-ink-faint">Aucune donnée</p>
      </div>
    )
  }
  const entries = typeof data === 'object' ? Object.entries(data) : [['valeur', data]]
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-ink-muted">{title}</p>
      <dl className="flex flex-col divide-y divide-line rounded-lg border border-line bg-canvas">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start justify-between gap-3 px-3 py-2 text-xs">
            <dt className="font-medium text-ink-muted">{key}</dt>
            <dd className="break-all text-right font-mono text-ink">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function EventDetailModal({ log, onClose }) {
  const op = log ? OPERATIONS[operationFromAction(log.action)] : null
  const failed = String(log?.status || '').toUpperCase() === 'FAILED'
  const meta = log
    ? [
        { icon: Clock, label: 'Horodatage', value: formatDateTime(log.createdAt) },
        { icon: Layers, label: 'Module', value: moduleLabel(log) },
        { icon: Hash, label: 'Élément concerné', value: log.entityId ? `${log.entity || ''} #${log.entityId}` : '-' },
        { icon: Globe, label: 'Adresse IP', value: log.ipAddress || '-' },
        { icon: Fingerprint, label: 'Identifiant événement', value: log.id ?? '-' },
      ]
    : []

  return (
    <Modal
      open={Boolean(log)}
      onClose={onClose}
      title={log ? ACTION_LABELS[log.action] || log.action : ''}
      description={op ? `Famille d'opération : ${op.label}` : ''}
      icon={Eye}
      size="lg"
      footer={<button type="button" className="ui-btn ui-btn-primary" onClick={onClose}>Fermer</button>}
    >
      {log && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-xl bg-navy p-4 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <OperationBadge action={log.action} />
              <StatusBadge tone={failed ? 'red' : 'green'}>{failed ? 'Échec' : 'Succès'}</StatusBadge>
            </div>
            <p className="text-pretty text-sm leading-relaxed text-brand-50">{getDescriptionLabel(log.action, log.description)}</p>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {meta.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 rounded-lg border border-line p-3">
                <Icon size={16} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
                <div className="flex min-w-0 flex-col">
                  <dt className="text-xs text-ink-muted">{label}</dt>
                  <dd className="truncate text-sm font-semibold text-ink">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          {(log.oldData || log.newData) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DataBlock title="Avant" data={log.oldData} />
              <DataBlock title="Après" data={log.newData} />
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
