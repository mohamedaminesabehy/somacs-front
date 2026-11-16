import { AlertTriangle, ArrowRight, Ban, Check, Gauge, Loader2, X } from 'lucide-react'
import { MISSION_STATUS_CONFIG as STATUS_CONFIG, MISSION_STATUS_STEPS as STATUS_STEPS } from '../../../constants/missionConstants'
import { NEXT_STEP_BY_STATUS } from './missionDetailsUtils'

function StatusTrack({ status }) {
  const isBlocked = status === 'Bloquée'
  const currentIndex = STATUS_STEPS.indexOf(status)
  return (
    <ol className="grid grid-cols-3 gap-1.5" aria-label="Progression de la mission">
      {STATUS_STEPS.map((step, idx) => {
        const done = !isBlocked && currentIndex >= idx
        const current = !isBlocked && currentIndex === idx
        return (
          <li key={step} className="min-w-0" aria-current={current ? 'step' : undefined}>
            <span className={`block h-1.5 rounded-full transition-colors duration-500 ${done ? 'bg-brand-600' : 'bg-line'}`} />
            <span className={`mt-1.5 block truncate text-[11px] font-semibold ${current ? 'text-brand-700' : done ? 'text-ink-soft' : 'text-ink-faint'}`}>
              {step}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function MileageInput({ label, value, onChange, mileageEditingRef }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{label}</span>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          max="999999"
          value={value}
          onFocus={() => { mileageEditingRef.current = true }}
          onBlur={() => { mileageEditingRef.current = false }}
          onChange={(e) => {
            const v = e.target.value
            if (v === '' || (Number(v) >= 0 && Number(v) <= 999999)) onChange(v)
          }}
          className="ui-input pr-10 font-mono"
          placeholder="0"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-faint">km</span>
      </div>
    </label>
  )
}

export default function MissionActionPanel({
  status, onStatusChange, pendingStatus, statusJustChangedTo,
  missionActionError, onDismissError, vehicle,
  vehicleKilometrageDepart, setVehicleKilometrageDepart,
  vehicleKilometrageRetour, setVehicleKilometrageRetour,
  vehicleMileageError, mileageEditingRef, showStatusAttention,
}) {
  const step = NEXT_STEP_BY_STATUS[status] || NEXT_STEP_BY_STATUS['À faire']
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG['À faire']
  const StatusIcon = statusCfg.icon
  const isBusy = Boolean(pendingStatus)
  const canBlock = status === 'À faire' || status === 'En cours'
  const canReopen = status === 'Terminée'

  return (
    <section
      aria-labelledby="mission-next-step"
      className={`ui-card overflow-hidden transition-shadow duration-300 ${showStatusAttention ? 'shadow-lift ring-2 ring-brand-200' : ''}`}
    >
      <div className="border-b border-line bg-brand-50/60 px-4 py-4 sm:px-5">
        <p className="ui-eyebrow">Votre prochaine étape</p>
        <div className="mt-2 flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${statusCfg.border} ${statusCfg.bg} ${statusCfg.color} ${statusJustChangedTo === status ? 'animate-in zoom-in-75 duration-300' : ''}`}>
            {StatusIcon && <StatusIcon size={18} aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            <h2 id="mission-next-step" className="font-display text-lg font-bold leading-snug tracking-tight text-ink">{step.title}</h2>
            <p className="mt-0.5 text-pretty text-sm leading-relaxed text-ink-muted">{step.hint}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <StatusTrack status={status} />

        {status === 'Bloquée' && (
          <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
            <Ban size={16} aria-hidden="true" className="shrink-0" />
            Mission signalée comme bloquée
          </p>
        )}

        {vehicle && (
          <fieldset className="flex flex-col gap-3 rounded-xl border border-line bg-canvas/60 p-3">
            <legend className="flex items-center gap-1.5 px-1 text-xs font-bold text-ink-soft">
              <Gauge size={14} aria-hidden="true" />
              Kilométrage — {vehicle.matricule}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <MileageInput label="Départ" value={vehicleKilometrageDepart} onChange={setVehicleKilometrageDepart} mileageEditingRef={mileageEditingRef} />
              <MileageInput label="Retour" value={vehicleKilometrageRetour} onChange={setVehicleKilometrageRetour} mileageEditingRef={mileageEditingRef} />
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">
              Compteur actuel : <span className="font-mono font-semibold text-ink-soft">
                {typeof vehicle.kilometrage === 'number' ? `${vehicle.kilometrage.toLocaleString('fr-FR')} km` : '—'}
              </span>. Enregistré au changement de statut.
            </p>
            {vehicleMileageError && (
              <p role="alert" className="flex items-start gap-2 text-xs font-semibold text-red-700">
                <AlertTriangle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
                {vehicleMileageError}
              </p>
            )}
          </fieldset>
        )}

        {missionActionError && (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-red-700">
            <p className="flex min-w-0 items-start gap-2 text-sm font-semibold">
              <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span className="break-words">{missionActionError}</span>
            </p>
            <button type="button" onClick={onDismissError} aria-label="Fermer le message d’erreur" className="shrink-0 rounded-md p-1 hover:bg-red-100">
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {step.next && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onStatusChange(step.next)}
              className="ui-btn-primary h-12 w-full text-[15px]"
            >
              {pendingStatus === step.next ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}
              {step.cta}
              <ArrowRight size={16} aria-hidden="true" className="ml-auto" />
            </button>
          )}
          {(canBlock || canReopen) && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onStatusChange(canBlock ? 'Bloquée' : 'En cours')}
              className={`ui-btn h-11 w-full border ${canBlock ? 'border-red-200 bg-white text-red-700 hover:bg-red-50' : 'border-line bg-white text-ink-soft hover:bg-brand-50 hover:text-brand-700'}`}
            >
              {pendingStatus && pendingStatus !== step.next ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : canBlock ? <Ban size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
              {canBlock ? 'Signaler un blocage' : 'Rouvrir la mission'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
