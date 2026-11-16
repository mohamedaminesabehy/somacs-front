import { Eye, EyeOff } from 'lucide-react'

function formatViewDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/** Indique si le technicien assigné a ouvert la fiche détaillée de la mission. */
export default function MissionViewBadge({ viewStatus }) {
  if (!viewStatus) return null
  if (!viewStatus.viewed) {
    return (
      <span className="ui-badge bg-slate-50 text-slate-500 ring-slate-200" title="Le technicien n'a pas encore ouvert cette mission">
        <EyeOff size={11} aria-hidden="true" /> Non consultée
      </span>
    )
  }
  const when = formatViewDate(viewStatus.firstViewedAt)
  const detail = [
    viewStatus.technicianName && `par ${viewStatus.technicianName}`,
    when && `le ${when}`,
    viewStatus.viewCount > 1 && `${viewStatus.viewCount} ouvertures`,
  ].filter(Boolean).join(' · ')
  return (
    <span className="ui-badge bg-teal-50 text-teal-800 ring-teal-200" title={detail ? `Consultée ${detail}` : 'Consultée'}>
      <Eye size={11} aria-hidden="true" /> Consultée{when ? ` · ${when}` : ''}
    </span>
  )
}
