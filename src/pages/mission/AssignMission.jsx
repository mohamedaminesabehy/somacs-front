import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertCircle, Calendar, Check, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList,
  Loader2, Send, Target, Truck, Users, Wrench,
} from 'lucide-react'
import HorizontalStepper from '../../components/common/HorizontalStepper'
import { ConfirmDialog } from '../intervention/components/interventionUi'
import { useAssignMissionData } from './hooks/useAssignMissionData'
import { useAssignMissionForm } from './hooks/useAssignMissionForm'
import { StepAssignment, StepDetails, StepReview, StepType } from './assign/AssignSteps'
import { MAX_TECHNICIANS, PRIORITIES } from './assign/assignConstants'

const steps = [
  { id: 1, title: 'Type', description: 'Nature de la mission', icon: Target },
  { id: 2, title: 'Détails', description: 'Contenu & lieu', icon: ClipboardList },
  { id: 3, title: 'Affectation', description: 'Équipe & planning', icon: Users },
  { id: 4, title: 'Validation', description: 'Ordre de mission', icon: CheckCircle2 },
]

function DraftPanel({ form, vehicles }) {
  const { missionType, formData, selectedEmployeeObjs, priority, dueDate, dueTime, vehicleId } = form
  const vehicle = vehicles.find((v) => String(v.id) === String(vehicleId))
  const prio = PRIORITIES.find((p) => p.key === priority)
  const rows = [
    { icon: missionType === 'Intervention' ? Wrench : ClipboardList, label: 'Type', value: missionType ? (missionType === 'Intervention' ? 'Intervention SAV' : 'Mission normale') : '' },
    { icon: ClipboardList, label: 'Titre', value: formData.title, extra: formData.interventionId },
    { icon: Users, label: 'Équipe', value: selectedEmployeeObjs.map((e) => e.name).join(', ') },
    { icon: Calendar, label: 'Planning', value: dueDate ? `${dueDate.split('-').reverse().join('/')}${dueTime ? ` · ${dueTime}` : ''}` : '' },
    { icon: Truck, label: 'Véhicule', value: vehicle?.matricule },
  ]
  return (
    <section aria-label="Brouillon de la mission" className="rounded-xl border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-faint">Brouillon</p>
        {prio && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
            <span className={`size-2 rounded-full ${prio.dot}`} aria-hidden="true" /> {prio.key}
          </span>
        )}
      </div>
      <dl className="flex flex-col gap-3 px-4 py-3">
        {rows.map(({ icon: Icon, label, value, extra }) => (
          <div key={label} className="flex min-w-0 items-start gap-2.5">
            <Icon size={14} className={`mt-0.5 shrink-0 ${value ? 'text-brand-700' : 'text-slate-300'}`} aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-[11px] font-medium text-ink-faint">{label}</dt>
              <dd className={`truncate text-sm ${value ? 'font-medium text-ink' : 'italic text-ink-faint'}`}>{value || 'À compléter'}</dd>
              {extra && <dd className="font-mono text-[11px] font-semibold text-brand-700">{extra}</dd>}
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default function AssignMission() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefillInterventionId = location.state?.prefillInterventionId || ''

  const { interventionsList, employeeList, availableVehicles, availableVehiclesLoading } = useAssignMissionData()

  const techniciansList = employeeList.filter((emp) => String(emp.role || '').trim().toLowerCase() === 'technicien')

  const form = useAssignMissionForm({ interventionsList, employeeList: techniciansList, navigate, prefillInterventionId })
  const { currentStep, missionType, showMaxEmployeesPopup, isSubmitting, handleSubmit, canGoNext, nextStep, prevStep, goToStep } = form

  const [showErrors, setShowErrors] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    contentRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [currentStep])

  const handleNext = () => {
    if (!canGoNext()) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    nextStep()
  }

  const handlePrev = () => {
    setShowErrors(false)
    prevStep()
  }

  const goToStepLocal = (target) => {
    setShowErrors(false)
    goToStep(target)
  }

  const confirmSubmit = async () => {
    await handleSubmit()
    setConfirmOpen(false)
  }

  const stepContent = {
    1: <StepType missionType={missionType} setMissionType={form.setMissionType} showErrors={showErrors} />,
    2: <StepDetails form={form} showErrors={showErrors} />,
    3: <StepAssignment form={form} technicians={techniciansList} vehicles={availableVehicles} vehiclesLoading={availableVehiclesLoading} showErrors={showErrors} />,
    4: <StepReview form={form} vehicles={availableVehicles} goToStep={goToStepLocal} />,
  }[currentStep]

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <div aria-live="assertive" className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4">
        {showMaxEmployeesPopup && (
          <p role="alert" className="pointer-events-auto flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-modal">
            <AlertCircle size={16} className="shrink-0 text-amber-300" aria-hidden="true" />
            {MAX_TECHNICIANS} techniciens maximum par mission. Retirez-en un pour en ajouter un autre.
          </p>
        )}
      </div>

      <header className="flex shrink-0 items-center gap-3 border-b border-line bg-white px-4 py-3 sm:px-6 sm:py-4">
        <button type="button" onClick={() => navigate('/missions')} aria-label="Retour aux missions" className="ui-btn-ghost -ml-2 shrink-0 px-2">
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">Missions · Nouvelle affectation</p>
          <h1 className="truncate font-display text-lg font-bold tracking-tight text-ink sm:text-xl">Affecter une mission</h1>
        </div>
      </header>

      <HorizontalStepper steps={steps} currentStep={currentStep} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside aria-label="Progression" className="hidden w-[288px] shrink-0 flex-col gap-6 border-r border-line bg-white px-6 py-7 lg:sticky lg:top-0 lg:flex lg:max-h-[calc(100vh-4rem)] lg:self-start lg:overflow-y-auto">
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <p className="ui-eyebrow">Progression</p>
              <p className="text-xs font-medium tabular-nums text-ink-muted">
                Étape <span className="font-semibold text-ink">{currentStep}</span> sur {steps.length}
              </p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} />
            </div>
          </div>

          <ol className="flex flex-col gap-1">
            {steps.map((step) => {
              const isActive = currentStep === step.id
              const isDone = currentStep > step.id
              const Icon = step.icon
              let iconTone = 'bg-slate-50 text-ink-faint ring-1 ring-inset ring-line'
              if (isActive) iconTone = 'bg-brand-600 text-white'
              else if (isDone) iconTone = 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200'
              const content = (
                <>
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
                    {isDone ? <Check size={16} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 text-left">
                    <span className={`block text-sm font-semibold ${isActive ? 'text-brand-700' : isDone ? 'text-ink' : 'text-ink-muted'}`}>{step.title}</span>
                    <span className="block truncate text-xs text-ink-muted">{isDone ? 'Terminé · modifier' : step.description}</span>
                  </span>
                </>
              )
              return (
                <li key={step.id} aria-current={isActive ? 'step' : undefined}>
                  {isDone ? (
                    <button type="button" onClick={() => goToStep(step.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
                      {content}
                    </button>
                  ) : (
                    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isActive ? 'bg-brand-50 ring-1 ring-inset ring-brand-100' : ''}`}>{content}</div>
                  )}
                </li>
              )
            })}
          </ol>

          <div className="mt-auto">
            <DraftPanel form={form} vehicles={availableVehicles} />
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <div ref={contentRef} className="mx-auto flex w-full max-w-4xl scroll-mt-20 flex-col px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
            <div key={currentStep} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {stepContent}
            </div>

            <div className="sticky bottom-0 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-line bg-white/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:mt-10 sm:bg-transparent sm:px-0 sm:pt-6">
              <button type="button" onClick={handlePrev} disabled={currentStep === 1} className="ui-btn-secondary disabled:invisible">
                <ChevronLeft size={16} aria-hidden="true" /> Précédent
              </button>
              <p className="hidden text-xs tabular-nums text-ink-muted sm:block">Étape {currentStep} sur {steps.length}</p>
              {currentStep < steps.length ? (
                <button type="button" onClick={handleNext} className="ui-btn-primary" aria-disabled={!canGoNext()}>
                  Continuer <ChevronRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" onClick={() => setConfirmOpen(true)} disabled={isSubmitting} className="ui-btn-primary">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
                  {isSubmitting ? 'Envoi…' : 'Envoyer l’ordre de mission'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        tone="info"
        title="Confirmer l’affectation ?"
        message={missionType === 'Intervention' && form.selectedIntervention
          ? `La mission sera envoyée à ${form.selectedEmployees.join(', ')} et le dossier ${form.selectedIntervention.id} passera au statut « Affectée ».`
          : `La mission sera envoyée à ${form.selectedEmployees.join(', ')} et apparaîtra dans leur tableau de bord.`}
        confirmLabel="Confirmer et envoyer"
        busy={isSubmitting}
        busyLabel="Envoi…"
        onClose={() => !isSubmitting && setConfirmOpen(false)}
        onConfirm={confirmSubmit}
      />
    </div>
  )
}
