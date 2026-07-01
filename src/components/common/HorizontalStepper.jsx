import React from 'react'
import StepIcon from './StepIcon'
import { getStepLabelColor } from '../../utils/stepStyles'

/**
 * Horizontal stepper bar used on mobile/tablet.
 * Renders steps in a row with connecting lines.
 *
 * @param {object} props
 * @param {Array<{id: number, title: string, icon: import('lucide-react').LucideIcon}>} props.steps
 * @param {number} props.currentStep - The active step id
 * @param {boolean} [props.alwaysVisible=false] - If true, always show; otherwise hide on lg screens
 * @param {function} [props.getLabelColor] - Custom label color function (isActive, isCompleted) => string
 */
export default function HorizontalStepper({ steps, currentStep, alwaysVisible = false, getLabelColor }) {
  const colorFn = getLabelColor || getStepLabelColor
  const containerClass = alwaysVisible
    ? 'bg-white border-b border-slate-100 px-4 py-3 shrink-0'
    : 'lg:hidden bg-white border-b border-slate-100 px-4 py-3 shrink-0'

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1">
                <StepIcon icon={step.icon} isActive={isActive} isCompleted={isCompleted} size="sm" />
                <span className={`text-[9px] font-black uppercase tracking-wide ${colorFn(isActive, isCompleted)}`}>
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors duration-300 ${currentStep > step.id ? 'bg-green-400' : 'bg-slate-100'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
