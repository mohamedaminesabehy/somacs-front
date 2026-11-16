import { Wrench, ClipboardList } from 'lucide-react'
import { getAvatarFromName } from '../../utils/format'
import { getStatusColorKey } from '../../utils/status'

export const priorityColors = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-700',
}

export const statusColors = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
}

export const interventionStatusColors = {
  PENDING: 'bg-amber-100 text-amber-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
}

export function getGroupedEmployeeNames(mission) {
  const fromDisplay = String(mission?.employeeDisplay || '')
    .split(',').map((name) => name.trim()).filter(Boolean)
  const fromArray = Array.isArray(mission?.groupedEmployees)
    ? mission.groupedEmployees.map((name) => String(name || '').trim()).filter(Boolean)
    : []
  const primary = String(mission?.employee || '').trim()
  return Array.from(new Set([...fromDisplay, ...fromArray, primary].filter(Boolean)))
}

export function getGroupedEmployeeStatuses(mission) {
  if (mission?.team?.length) return mission.team.map(member => ({ name: member.name || 'Non renseigné', status: member.status || mission.status, notes: member.notes || '' }))
  const rows = Array.isArray(mission?.groupedEmployeeStatuses) ? mission.groupedEmployeeStatuses : []
  if (rows.length > 0) {
    return rows
      .map((row) => ({
        name: String(row?.employeeName || '').trim(),
        status: String(row?.status || '').trim() || 'À faire',
        notes: String(row?.notes || '').trim(),
      }))
      .filter((row) => row.name)
  }
  const names = getGroupedEmployeeNames(mission)
  return names.map((name) => ({
    name,
    status: String(mission?.status || 'À faire'),
    notes: String(mission?.notes || '').trim(),
  }))
}

export function truncateText(value, max = 70) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (text.length <= max) return text
  return `${text.slice(0, max)}....`
}

export function getPriorityColor(priority) {
  if (priority === 'Critique') return 'red'
  if (priority === 'Haute') return 'orange'
  if (priority === 'Moyenne') return 'yellow'
  return 'gray'
}

export function getStatusIcon(status) {
  switch (status) {
    case 'En cours':
    case 'À faire':
      return '● '
    case 'Terminée':
      return '✓ '
    case 'Bloquée':
      return '⊗ '
    default:
      return ''
  }
}

export function getPriorityPrefix(priority) {
  switch (priority) {
    case 'Critique':
      return '⚠️ '
    case 'Haute':
      return '↗ '
    case 'Moyenne':
      return '– '
    case 'Basse':
      return '↘ '
    default:
      return ''
  }
}

export function getMissionDisplayData(mission) {
  const IconComponent = mission.type === 'Intervention' ? Wrench : ClipboardList
  const priorityColor = getPriorityColor(mission.priority)
  const statusColor = getStatusColorKey(mission.status)
  const employeeDisplay = mission.employeeDisplay || mission.employee
  const groupedStatuses = getGroupedEmployeeStatuses(mission)
  const isGroupedMission = groupedStatuses.length > 1
  const avatar = getAvatarFromName(employeeDisplay)
  return { IconComponent, priorityColor, statusColor, employeeDisplay, groupedStatuses, isGroupedMission, avatar }
}

export function getViewStatusColor(status) {
  if (status === 'En cours') return 'yellow'
  if (status === 'Terminée') return 'green'
  if (status === 'Bloquée') return 'red'
  return 'blue'
}

import { apiFetch } from '../../api/apiClient'

export function validateMissionForm({ formTitle, formDescription, formEmployeeIds, formEmployee, missionType, selectedInterventionId }) {
  if (!formTitle?.trim() || !formDescription?.trim()) return 'Veuillez remplir le titre et la description.'
  if (formEmployeeIds?.length > 3) return 'Une mission peut avoir au maximum 3 techniciens.'
  const hasMultiple = Array.isArray(formEmployeeIds) && formEmployeeIds.length > 0
  const hasSingle = formEmployee && String(formEmployee).trim() !== ''
  if (!hasMultiple && !hasSingle) return 'Veuillez sélectionner au moins un employé.'
  if (missionType === 'Intervention' && !selectedInterventionId) return 'Veuillez sélectionner une intervention.'
  return null
}

import { updateMissionWith } from './missionUpdate.mjs'

export { buildMissionUpdateRequest, submitMissionEdit } from './missionUpdate.mjs'

export function updateMission(params) {
  return updateMissionWith(apiFetch, params)
}
