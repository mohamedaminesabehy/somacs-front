import { ArrowLeft, Calendar, Clock, Wrench, ClipboardList, Users } from 'lucide-react'
import { formatLongDate, formatMissionRef } from './missionDetailsUtils'

export default function MissionHero({ mission, status, statusCfg, priority, teamSize, onBack, backLabel }) {
  const isIntervention = mission.type === 'Intervention'
  const TypeIcon = isIntervention ? Wrench : ClipboardList
  const StatusIcon = statusCfg.icon

  return (
    <header className="relative overflow-hidden bg-navy-900 text-white">
      <div className="mx-auto w-full max-w-[1480px] px-4 pb-6 pt-3 sm:px-6 sm:pb-8 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {backLabel}
        </button>

        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-xs font-semibold tracking-tight text-white ring-1 ring-inset ring-white/15">
                {formatMissionRef(mission.id)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-500/25 px-2 py-1 text-xs font-semibold text-brand-100">
                <TypeIcon size={13} aria-hidden="true" />
                {isIntervention ? 'Intervention S.A.V' : mission.type || 'Mission'}
              </span>
            </div>
            <h1 className="mt-3 text-balance font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              {mission.title || 'Mission sans titre'}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
              {mission.dueDate && (
                <span className="inline-flex items-center gap-1.5 capitalize">
                  <Calendar size={15} aria-hidden="true" />
                  {formatLongDate(mission.dueDate)}
                </span>
              )}
              {mission.dueTime && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} aria-hidden="true" />
                  {mission.dueTime}
                </span>
              )}
              {teamSize > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Users size={15} aria-hidden="true" />
                  {teamSize > 1 ? `Équipe de ${teamSize} techniciens` : '1 technicien'}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${statusCfg.badge}`}>
              {StatusIcon && <StatusIcon size={14} aria-hidden="true" />}
              {status}
            </span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold ${priority.badge}`}>
              Priorité {String(priority.label).toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
