import { FileText } from 'lucide-react'
import { DetailCard, Field } from './DetailCard'
import { formatLongDate } from './missionDetailsUtils'

export default function MissionInfoCard({ mission, status, priority }) {
  return (
    <DetailCard icon={FileText} title="Informations mission">
      <div className="flex flex-col gap-5">
        <div>
          <p className="ui-eyebrow">Description</p>
          <p className="mt-1.5 whitespace-pre-line text-pretty text-[15px] leading-relaxed text-ink-soft">
            {mission.description || 'Aucune description fournie pour cette mission.'}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-4 sm:grid-cols-3">
          <Field label="Type">{mission.type === 'Intervention' ? 'Intervention S.A.V' : mission.type}</Field>
          <Field label="Date d’intervention"><span className="capitalize">{formatLongDate(mission.dueDate)}</span></Field>
          <Field label="Heure">{mission.dueTime}</Field>
          <Field label="Statut">{status}</Field>
          <Field label="Priorité"><span className={priority.color}>{priority.label}</span></Field>
          {mission.interventionId && <Field label="Dossier SAV"><span className="font-mono">{mission.interventionId}</span></Field>}
        </dl>
      </div>
    </DetailCard>
  )
}
