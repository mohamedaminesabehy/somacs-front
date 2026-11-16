import { AlertTriangle, ChevronRight, History, Lock, Wrench, X } from 'lucide-react'
import { DetailCard } from './DetailCard'

export default function MissionInterventionCard({ intervention, onOpen }) {
  const isClosed = intervention.status === 'CLOSED'
  return (
    <DetailCard
      icon={Wrench}
      title="Intervention liée"
      action={
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${isClosed ? 'bg-canvas text-ink-muted ring-line' : 'bg-brand-50 text-brand-700 ring-brand-100'}`}>
          {isClosed ? 'Clôturée' : 'SAV ouvert'}
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        <dl className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-sm text-ink-muted">Référence</dt>
            <dd className="ui-ref">{intervention.id}</dd>
          </div>
          {intervention.machine && (
            <div className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-sm text-ink-muted">Machine</dt>
              <dd className="min-w-0 break-words text-right text-sm font-semibold text-ink">{intervention.machine}</dd>
            </div>
          )}
        </dl>
        <button
          type="button"
          onClick={onOpen}
          className={`h-11 w-full ${isClosed ? 'ui-btn-secondary' : 'ui-btn-primary'}`}
        >
          {isClosed ? <Lock size={16} aria-hidden="true" /> : <Wrench size={16} aria-hidden="true" />}
          {isClosed ? 'Intervention clôturée' : 'Ouvrir le dossier'}
          <ChevronRight size={16} aria-hidden="true" className="ml-auto" />
        </button>
      </div>
    </DetailCard>
  )
}

export function InterventionClosedDialog({ interventionId, onClose, onGoToHistory }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="intervention-closed-title">
      <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-2xl border border-line bg-white shadow-raised animate-in fade-in slide-in-from-bottom-4 duration-200 sm:rounded-2xl">
        <div className="flex items-start gap-3 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200">
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="intervention-closed-title" className="font-display text-base font-bold text-ink">Intervention clôturée</h2>
            <p className="mt-1 text-pretty text-sm leading-relaxed text-ink-muted">
              Pour modifier ou consulter le détail de l’intervention <span className="font-mono font-semibold text-ink-soft">{interventionId}</span>, rendez-vous dans l’historique des interventions.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="ui-icon-btn shrink-0">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-line bg-canvas/60 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="ui-btn-secondary">Fermer</button>
          <button type="button" onClick={onGoToHistory} className="ui-btn-primary">
            <History size={16} aria-hidden="true" />
            Aller à l’historique
          </button>
        </div>
      </div>
    </div>
  )
}
