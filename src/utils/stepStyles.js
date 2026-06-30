/**
 * Step indicator style helpers.
 * Used across wizard-style forms (AssignMission, CreateIntervention, MachineForm).
 */

export function getStepTextColor(isActive, isDone) {
  if (isActive) return 'text-[#0052CC]'
  if (isDone) return 'text-green-500'
  return 'text-slate-300'
}

export function getStepTitleColor(isActive, isDone) {
  if (isActive) return 'text-slate-900'
  if (isDone) return 'text-slate-600'
  return 'text-slate-400'
}

export function getStepDescColor(isActive, isDone) {
  if (isActive) return 'text-slate-500'
  if (isDone) return 'text-slate-400'
  return 'text-slate-300'
}

export function getStepLabelColor(isActive, isCompleted) {
  if (isActive) return 'text-[#0052CC]'
  if (isCompleted) return 'text-green-500'
  return 'text-slate-400'
}
