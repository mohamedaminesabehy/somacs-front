import { Car, Truck, Users } from 'lucide-react'
import { DetailCard } from './DetailCard'
import { getInitials } from './missionDetailsUtils'

export default function MissionTeamCard({ members, vehicle, currentUserId }) {
  return (
    <DetailCard
      icon={Users}
      title="Équipe et véhicule"
      action={members.length > 0 && (
        <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-bold text-ink-muted ring-1 ring-inset ring-line">
          {members.length}
        </span>
      )}
      bodyClassName="flex flex-col divide-y divide-line"
    >
      {members.length > 0 ? (
        <ul className="flex flex-col gap-1 p-2 sm:p-3">
          {members.map((member) => {
            const isMe = currentUserId != null && String(member.userId) === String(currentUserId)
            return (
              <li key={member.key} className={`flex items-center gap-3 rounded-xl px-2 py-2 ${isMe ? 'bg-brand-50/70' : ''}`}>
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isMe ? 'bg-brand-600 text-white' : 'bg-navy-700 text-white'}`}
                >
                  {getInitials(member.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {member.name}
                    {isMe && <span className="ml-1.5 text-xs font-semibold text-brand-700">(vous)</span>}
                  </p>
                </div>
                {member.isDriver && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
                    <Car size={12} aria-hidden="true" />
                    Chauffeur
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="p-4 text-sm text-ink-faint sm:p-5">Aucun technicien affecté.</p>
      )}

      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas text-ink-muted ring-1 ring-inset ring-line">
          <Truck size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="ui-eyebrow">Véhicule</p>
          {vehicle ? (
            <>
              <p className="mt-1 font-mono text-sm font-bold text-ink">{vehicle.matricule}</p>
              <p className="text-sm text-ink-muted">{[vehicle.marque, vehicle.modele].filter(Boolean).join(' ') || 'Modèle non renseigné'}</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-ink-faint">Aucun véhicule affecté.</p>
          )}
        </div>
      </div>
    </DetailCard>
  )
}
