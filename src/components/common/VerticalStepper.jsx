import { Check } from 'lucide-react'

/**
 * Vertical stepper sidebar used on desktop.
 *
 * @param {object} props
 * @param {Array<{id: number, title: string, description: string, icon: import('lucide-react').LucideIcon}>} props.steps
 * @param {number} props.currentStep - The active step id
 * @param {boolean} [props.hidden=false] - If true, the sidebar is hidden (e.g. when zoom forces horizontal layout)
 */
export default function VerticalStepper({ steps, currentStep, hidden = false }) {
  if (hidden) return null

  const currentIndex = Math.max(0, steps.findIndex((s) => s.id === currentStep))
  const progress = steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 100

  return (
    <aside className="hidden w-[288px] shrink-0 flex-col gap-8 border-r border-line bg-white px-6 py-7 lg:flex" aria-label="Progression">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <p className="ui-eyebrow">Progression</p>
          <p className="text-xs font-medium text-ink-muted tabular-nums">
            Étape <span className="font-semibold text-ink">{currentIndex + 1}</span> sur {steps.length}
          </p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ol className="flex flex-col">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          const Icon = step.icon
          return (
            <li key={step.id} className="relative flex gap-4 pb-7 last:pb-0" aria-current={isActive ? 'step' : undefined}>
              {idx < steps.length - 1 && (
                <span
                  className={`absolute left-[19px] top-11 bottom-1 w-0.5 rounded-full transition-colors ${isCompleted ? 'bg-brand-600' : 'bg-line'}`}
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all
                  ${isCompleted ? 'bg-brand-600 text-white' : ''}
                  ${isActive ? 'bg-navy text-white shadow-raised ring-4 ring-brand-100' : ''}
                  ${!isActive && !isCompleted ? 'bg-slate-50 text-ink-faint ring-1 ring-inset ring-line' : ''}`}
              >
                {isCompleted ? <Check size={17} strokeWidth={2.5} aria-hidden="true" /> : Icon ? <Icon size={17} aria-hidden="true" /> : step.id}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${isActive ? 'text-brand-600' : 'text-ink-faint'}`}>
                  Étape {idx + 1}
                </p>
                <p className={`truncate text-sm font-semibold ${isActive || isCompleted ? 'text-ink' : 'text-ink-muted'}`}>{step.title}</p>
                {step.description && (
                  <p className="mt-0.5 truncate text-xs text-ink-muted">{step.description}</p>
                )}
              </div>
              {isCompleted && <span className="sr-only">(terminée)</span>}
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
