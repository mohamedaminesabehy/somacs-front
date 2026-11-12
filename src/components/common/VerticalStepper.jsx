import StepIcon from './StepIcon'

/**
 * Vertical stepper sidebar used on desktop.
 * Renders steps vertically with connecting lines and descriptions.
 *
 * @param {object} props
 * @param {Array<{id: number, title: string, description: string, icon: import('lucide-react').LucideIcon}>} props.steps
 * @param {number} props.currentStep - The active step id
 * @param {boolean} [props.hidden=false] - If true, the sidebar is hidden (e.g. when zoom forces horizontal layout)
 */
export default function VerticalStepper({ steps, currentStep, hidden = false }) {
  const containerClass = hidden
    ? 'hidden'
    : 'hidden lg:flex w-[320px] border-r border-slate-50 bg-slate-50/30 flex-col p-8 shrink-0 min-w-0'

  return (
    <div className={containerClass}>
      <div className="space-y-2 mb-12">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Progression</h4>
        <div className="h-1 w-12 bg-brand-600 rounded-full"></div>
      </div>

      <div className="space-y-1">
        {steps.map((step) => {
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          return (
            <div key={step.id} className="relative pb-10 last:pb-0">
              {step.id !== steps.length && (
                <div className={`absolute left-6 top-14 bottom-0 w-0.5 rounded-full ${isCompleted ? 'bg-brand-600' : 'bg-slate-100'}`} />
              )}
              <div className="flex items-start gap-5 group cursor-default">
                <StepIcon icon={step.icon} isActive={isActive} isCompleted={isCompleted} size="lg" />
                <div className="pt-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 transition-colors ${isActive ? 'text-brand-600' : 'text-slate-300'}`}>
                    Étape 0{step.id}
                  </p>
                  <p className={`text-base font-black tracking-tight transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.title}
                  </p>
                  <p className={`text-[11px] font-bold mt-0.5 transition-colors ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
