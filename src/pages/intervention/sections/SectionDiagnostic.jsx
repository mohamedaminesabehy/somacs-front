import { Clock, AlertTriangle, Wrench, PhoneCall, FlaskConical, CheckCircle2, XCircle, Timer } from 'lucide-react'
import { FieldGroup, FormField, InterventionTypePicker } from '../components/interventionUi'

export default function SectionDiagnostic({ interventionData, handleChange, setInterventionData }) {
  const problem = interventionData.problemDescription || ''
  return (
    <div className="flex flex-col gap-7">
      <InterventionTypePicker value={interventionData.interventionType} onChange={handleChange} compact />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FieldGroup title="Constat" icon={AlertTriangle} columns={1}>
          <FormField label="Type de panne" htmlFor="diag-problem" counter={`${problem.length} car.`}>
            <textarea id="diag-problem" name="problemDescription" value={problem} onChange={handleChange}
              placeholder="Décrivez précisément la panne constatée…"
              className="ui-textarea min-h-28 w-full resize-y leading-relaxed" />
          </FormField>
          <FormField label="Diagnostic téléphonique" htmlFor="diag-phone" icon={PhoneCall}>
            <textarea id="diag-phone" name="telephoneDiagnostic" value={interventionData.telephoneDiagnostic || ''} onChange={handleChange}
              placeholder="Résumé du diagnostic réalisé à distance…"
              className="ui-textarea min-h-28 w-full resize-y pl-10 leading-relaxed" />
          </FormField>
        </FieldGroup>

        <FieldGroup title="Solution" icon={Wrench} columns={1}>
          <FormField label="Solution d'intervention" htmlFor="diag-solution" hint="Actions correctives réalisées sur l’équipement.">
            <textarea id="diag-solution" name="interventionDetail" value={interventionData.interventionDetail || ''} onChange={handleChange}
              placeholder="Remplacement, réglage, mise à jour…"
              className="ui-textarea min-h-[15.5rem] w-full resize-y leading-relaxed" />
          </FormField>
        </FieldGroup>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TestResultPanel interventionData={interventionData} handleChange={handleChange} setInterventionData={setInterventionData} />
        <TimePanel interventionData={interventionData} handleChange={handleChange} />
      </div>
    </div>
  )
}

function TestResultPanel({ interventionData, handleChange, setInterventionData }) {
  const value = interventionData.essaiConcluant
  const option = (val, label, Icon, activeClass) => (
    <button
      type="button"
      role="radio"
      aria-checked={value === val}
      onClick={() => setInterventionData((prev) => ({ ...prev, essaiConcluant: val }))}
      className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 ${value === val ? activeClass : 'border-line bg-white text-ink-muted hover:bg-slate-50'}`}
    >
      <Icon size={16} aria-hidden="true" /> {label}
    </button>
  )
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-slate-50/50 p-4">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
        <FlaskConical size={13} className="text-brand-600" aria-hidden="true" /> Essais
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[8rem_1fr]">
        <FormField label="Nombre d'essais" htmlFor="diag-essai">
          <input id="diag-essai" type="number" name="numEssai" value={interventionData.numEssai ?? ''} onChange={handleChange} min="0" step="1" className="ui-input w-full font-semibold tabular-nums" />
        </FormField>
        <div className="flex flex-col gap-1.5">
          <p id="diag-concluant" className="text-xs font-semibold text-ink-soft">Essai concluant</p>
          <div role="radiogroup" aria-labelledby="diag-concluant" className="flex gap-2">
            {option(true, 'Oui', CheckCircle2, 'border-teal-300 bg-teal-50 text-teal-800')}
            {option(false, 'Non', XCircle, 'border-red-300 bg-red-50 text-red-700')}
          </div>
        </div>
      </div>
    </div>
  )
}

function TimePanel({ interventionData, handleChange }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-slate-50/50 p-4">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
        <Clock size={13} className="text-brand-600" aria-hidden="true" /> Durée sur site
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <FormField label="Entrée" htmlFor="diag-start">
          <input id="diag-start" type="time" name="startTime" value={interventionData.startTime || ''} onChange={handleChange} className="ui-input w-full tabular-nums" />
        </FormField>
        <FormField label="Sortie" htmlFor="diag-end">
          <input id="diag-end" type="time" name="endTime" value={interventionData.endTime || ''} onChange={handleChange} className="ui-input w-full tabular-nums" />
        </FormField>
        <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
          <span className="text-xs font-semibold text-ink-soft">Total calculé</span>
          <output name="totalTime" className="flex h-11 items-center gap-2 rounded-xl bg-navy px-3 font-display text-base font-bold text-white tabular-nums">
            <Timer size={15} className="text-brand-300" aria-hidden="true" />
            {interventionData.totalTime || '—'}
          </output>
        </div>
      </div>
    </div>
  )
}
