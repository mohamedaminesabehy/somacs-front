import { Building2, Cpu, ExternalLink, MapPin, Phone } from 'lucide-react'
import { DetailCard } from './DetailCard'

function resolveClient(mission, intervention) {
  const entity = intervention?.clientEntity
  return {
    name: entity?.name || intervention?.client || mission.site || '',
    site: mission.site && mission.site !== (entity?.name || intervention?.client) ? mission.site : intervention?.siteName || '',
    address: mission.address || entity?.address || '',
    city: entity?.city || '',
    phone: intervention?.phone || entity?.phone || '',
  }
}

function resolveMachine(intervention) {
  const entity = intervention?.machineEntity
  if (!entity && !intervention?.machine) return null
  return {
    label: entity?.designation || intervention?.machine || '',
    reference: entity?.code || entity?.serialNumber || '',
    brand: [entity?.brand, entity?.model].filter(Boolean).join(' '),
  }
}

export default function MissionClientCard({ mission, intervention }) {
  const client = resolveClient(mission, intervention)
  const machine = resolveMachine(intervention)
  const mapsQuery = [client.name, client.address, client.city].filter(Boolean).join(', ')

  return (
    <DetailCard icon={Building2} title="Client et machine" bodyClassName="flex flex-col divide-y divide-line">
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="break-words font-display text-base font-bold text-ink">{client.name || 'Client non renseigné'}</p>
          {client.site && <p className="mt-0.5 text-sm text-ink-muted">{client.site}</p>}
        </div>
        <p className="flex items-start gap-2 text-sm leading-relaxed text-ink-soft">
          <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-faint" />
          <span className="break-words">{[client.address, client.city].filter(Boolean).join(', ') || 'Adresse non renseignée'}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {mapsQuery && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-btn-secondary h-10 min-w-0 flex-1 sm:flex-none"
            >
              <ExternalLink size={15} aria-hidden="true" />
              <span className="truncate">Itinéraire</span>
              <span className="sr-only">(nouvel onglet)</span>
            </a>
          )}
          {client.phone && (
            <a href={`tel:${client.phone}`} className="ui-btn-secondary h-10 min-w-0 flex-1 sm:flex-none">
              <Phone size={15} aria-hidden="true" />
              <span className="truncate font-mono">{client.phone}</span>
            </a>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas text-ink-muted ring-1 ring-inset ring-line">
          <Cpu size={18} aria-hidden="true" />
        </span>
        {machine ? (
          <div className="min-w-0">
            <p className="ui-eyebrow">Machine concernée</p>
            <p className="mt-1 break-words text-sm font-bold text-ink">{machine.label || 'Machine'}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              {machine.reference && <span className="ui-ref">{machine.reference}</span>}
              {machine.brand && <span>{machine.brand}</span>}
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="ui-eyebrow">Machine concernée</p>
            <p className="mt-1 text-sm text-ink-faint">Aucune machine liée à cette mission.</p>
          </div>
        )}
      </div>
    </DetailCard>
  )
}
