import { useMemo } from 'react'

/**
 * Builds grouped employee display names and deduplicates missions by assignment group.
 */
export function useMissionGrouping(missions) {
  const missionsWithGroupedEmployees = useMemo(() => {
    const namesByGroup = buildNamesByGroup(missions)
    return missions.map((mission) => enrichEmployeeDisplay(mission, namesByGroup))
  }, [missions])

  const groupedMissionRows = useMemo(() => {
    return buildGroupedRows(missionsWithGroupedEmployees)
  }, [missionsWithGroupedEmployees])

  return { missionsWithGroupedEmployees, groupedMissionRows }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildNamesByGroup(missions) {
  const namesByGroup = new Map()
  for (const mission of missions) {
    const groupId = mission?.assignmentGroupId
    const serverNames = Array.isArray(mission?.groupedEmployees)
      ? mission.groupedEmployees.map((n) => String(n || '').trim()).filter(Boolean)
      : []
    const employeeName = String(mission?.employee || '').trim()
    const allNames = serverNames.length > 0 ? serverNames : (employeeName ? [employeeName] : [])
    if (!groupId || allNames.length === 0) continue
    if (!namesByGroup.has(groupId)) namesByGroup.set(groupId, new Set())
    allNames.forEach((n) => namesByGroup.get(groupId).add(n))
  }
  return namesByGroup
}

function enrichEmployeeDisplay(mission, namesByGroup) {
  if (mission?.employeeDisplay && String(mission.employeeDisplay).trim()) return mission
  const groupId = mission?.assignmentGroupId
  if (!groupId || !namesByGroup.has(groupId)) {
    return { ...mission, employeeDisplay: mission?.employee || '' }
  }
  return { ...mission, employeeDisplay: Array.from(namesByGroup.get(groupId)).join(', ') }
}

function buildGroupedRows(missionsWithDisplay) {
  const firstByGroup = new Map()
  const entriesByGroup = new Map()
  const standalone = []

  for (const mission of missionsWithDisplay) {
    const groupId = String(mission?.assignmentGroupId || '').trim()
    if (!groupId) { standalone.push(mission); continue }
    if (!entriesByGroup.has(groupId)) entriesByGroup.set(groupId, [])
    const employeeName = String(mission?.employee || '').trim()
    if (employeeName) {
      entriesByGroup.get(groupId).push({
        missionId: mission.id,
        employeeName,
        employeeUserId: mission.employeeUserId,
        status: mission.status,
        notes: mission.notes,
      })
    }
    if (!firstByGroup.has(groupId)) firstByGroup.set(groupId, mission)
  }

  const groupedRows = Array.from(firstByGroup.entries()).map(([groupId, mission]) => {
    const rawEntries = entriesByGroup.get(groupId) || []
    const uniq = deduplicateEntries(rawEntries)
    return { ...mission, groupedEmployeeStatuses: Array.from(uniq.values()) }
  })

  return [...standalone, ...groupedRows].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))
}

function deduplicateEntries(entries) {
  const uniq = new Map()
  for (const row of entries) {
    const key = `${row.employeeUserId || ''}_${row.employeeName}`
    if (!uniq.has(key)) uniq.set(key, row)
  }
  return uniq
}
