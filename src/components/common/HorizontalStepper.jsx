import { Check } from 'lucide-react'

/**
 * Horizontal stepper bar used on mobile/tablet.
 *
 * @param {object} props
 * @param {Array<{id: number, title: string, icon: import('lucide-react').LucideIcon}>} props.steps
 * @param {number} props.currentStep - The active step id
 * @param {boolean} [props.alwaysVisible=false] - If true, always show; otherwise hide on lg screens
 */
export default function HorizontalStepper({ steps, currentStep, alwaysVisible = false }) {
  const currentIndex = Math.max(0, steps.findIndex((s) => s.id === currentStep))
  const current = steps[currentIndex]

  return (
    <nav
      aria-label="Progression"
      className={`shrink-0 border-b border-line bg-white px-4 py-3 sm:px-6 ${alwaysVisible ? '' : 'lg:hidden'}`}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-semibold text-ink">
            <span className="text-brand-600">Étape {currentIndex + 1}</span>
            <span className="text-ink-faint"> · </span>
            {current?.title}
          </p>
          <p className="shrink-0 text-xs font-medium text-ink-muted tabular-nums">{currentIndex + 1} / {steps.length}</p>
        </div>
        <ol className="flex items-center gap-1.5">
          {steps.map((step) => {
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            return (
              <li key={step.id} className="flex flex-1 items-center" aria-current={isActive ? 'step' : undefined}>
                <span className="sr-only">{step.title}{isCompleted ? ' (terminée)' : ''}</span>
                <span
                  className={`flex h-1.5 w-full rounded-full transition-colors duration-300 ${isCompleted ? 'bg-brand-600' : isActive ? 'bg-navy' : 'bg-slate-200'}`}
                  aria-hidden="true"
                />
                {isCompleted && step.id === steps[steps.length - 1].id && <Check size={12} className="ml-1 text-brand-600" aria-hidden="true" />}
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
