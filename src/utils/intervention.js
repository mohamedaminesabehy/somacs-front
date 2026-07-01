export const INTERVENTION_STATUS_TO_SECTION = {
  PENDING: 1,
  ASSIGNED: 2,
  IN_PROGRESS: 2,
  TESTING: 3,
  CLOSED: 4,
}

export const INTERVENTION_STATUS_CONFIG = {
  PENDING: { label: 'En attente', color: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  ASSIGNED: { label: 'AffectÃ©e', color: 'bg-blue-50 text-blue-700 border border-blue-200', dot: 'bg-blue-500' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-orange-50 text-orange-700 border border-orange-200', dot: 'bg-orange-500' },
  TESTING: { label: 'En test', color: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
  CLOSED: { label: 'ClÃ´turÃ©', color: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500' },
}

export const INTERVENTION_STATUS_BADGE = Object.fromEntries(
  Object.entries(INTERVENTION_STATUS_CONFIG).map(([status, config]) => [status, config.color]),
)

export function getInterventionStatusLabel(status) {
  return INTERVENTION_STATUS_CONFIG[status]?.label || status || ''
}

export function formatClientAddress(client) {
  if (!client) return ''
  if (client.address) return String(client.address)
  const city = client.city ? String(client.city).trim() : ''
  const zone = client.zone ? String(client.zone).trim() : ''
  if (!city && !zone) return ''
  return zone ? `${city}, ${zone}` : city
}

export function buildAssignedEmployeesDisplay(missionLike, fallback = '') {
  const primary = String(missionLike?.employee || '').trim()
  const fromArray = Array.isArray(missionLike?.groupedEmployees)
    ? missionLike.groupedEmployees.map((name) => String(name || '').trim()).filter(Boolean)
    : []
  const fromDisplay = String(missionLike?.employeeDisplay || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
  const fallbackName = String(fallback || '').trim()
  const names = Array.from(new Set([primary, ...fromArray, ...fromDisplay, fallbackName].filter(Boolean)))
  return names.join(', ')
}

export function mapRawToInterventionData(raw, assignedTechnicianName = '') {
  const clientEntity = raw?.clientEntity || null
  const machineEntity = raw?.machineEntity || null

  return {
    clientId: raw?.clientId || clientEntity?.id || '',
    machineId: raw?.machineId || machineEntity?.id || '',
    ...mapDateTimeFields(raw),
    technicianName: resolveTechnicianName(raw, assignedTechnicianName),
    ficheNumber: raw?.ficheNumber || '',
    ...mapClientFields(raw, clientEntity),
    ...mapMachineFields(raw, machineEntity),
    ...mapDiagnosticFields(raw),
  }
}

function mapDateTimeFields(raw) {
  return {
    interventionDate: raw?.interventionDate || raw?.date || '',
    startTime: raw?.startTime || '',
    endTime: raw?.endTime || '',
    totalTime: raw?.totalTime || '',
  }
}

function resolveTechnicianName(raw, fallback) {
  return fallback || raw?.assignedEmployeesDisplay || raw?.technicianName || raw?.assignedTo || raw?.assignee || raw?.technician || ''
}

function mapClientFields(raw, clientEntity) {
  return {
    siteName: raw?.siteName || raw?.site || clientEntity?.site || '',
    clientName: raw?.clientName || raw?.client || clientEntity?.name || '',
    clientCode: raw?.clientCode || clientEntity?.code || '',
    clientPhone: raw?.clientPhone || raw?.phone || clientEntity?.phone || '',
    clientEmail: raw?.clientEmail || clientEntity?.email || '',
    clientAddress: raw?.clientAddress || formatClientAddress(clientEntity) || '',
    requestorName: raw?.requestorName || '',
  }
}

function mapMachineFields(raw, machineEntity) {
  return {
    machineType: raw?.machineType || raw?.machine || machineEntity?.designation || '',
    machineBrand: raw?.machineBrand || machineEntity?.brand || '',
    machineModel: raw?.machineModel || machineEntity?.year || '',
    serialNumber: raw?.serialNumber || machineEntity?.serialNumber || '',
  }
}

function mapDiagnosticFields(raw) {
  return {
    problemDescription: raw?.problemDescription || raw?.request || '',
    telephoneDiagnostic: raw?.telephoneDiagnostic || '',
    interventionType: raw?.interventionType || raw?.type || '',
    interventionDetail: raw?.interventionDetail || '',
    numEssai: raw?.numEssai || '',
    essaiConcluant: raw?.essaiConcluant ?? null,
  }
}
