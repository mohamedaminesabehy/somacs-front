import test from 'node:test'
import assert from 'node:assert/strict'
import { submitMissionEdit, updateMissionWith } from '../src/components/mission/missionUpdate.mjs'

function createStore({ conflict = false } = {}) {
  const missions = [
    { id: 41, title: 'Maintenance autoclave', status: 'Planifiée', employeeUserIds: [4, 5], vehicleId: null, driverUserId: null },
    { id: 42, title: 'Installation analyseur', status: 'Planifiée', employeeUserIds: [2], vehicleId: null, driverUserId: null },
  ]
  const calls = []
  const fetcher = async (path, { method = 'GET', body } = {}) => {
    calls.push({ method, path, body })
    const respond = (payload, status = 200) => ({ ok: status < 400, status, json: async () => payload })
    if (method === 'POST' && path === '/missions') {
      missions.push({ id: 99, ...body })
      return respond({ id: 99 }, 201)
    }
    const match = path.match(/^\/missions\/(\d+)$/)
    if (method === 'PATCH' && match) {
      if (conflict) return respond({ message: 'La mission a été modifiée par un autre utilisateur.' }, 409)
      const mission = missions.find((m) => m.id === Number(match[1]))
      Object.assign(mission, body)
      return respond(mission)
    }
    return respond({ message: 'Not found' }, 404)
  }
  return { missions, calls, fetcher }
}

const editParams = {
  formMissionId: 41,
  formTitle: 'Maintenance autoclave (corrigée)',
  formDescription: 'Contrôle complet',
  formPriority: 'Haute',
  formStatus: 'Planifiée',
  formDueDate: '2026-11-20',
  formDueTime: '09:00',
  formNotes: '',
  missionType: 'Normal',
  formSite: 'Clinique Les Oliviers',
  formAddress: 'Route de Tunis km 3',
  formEmployeeIds: [4, 5, 2],
  formVehicleId: '3',
  formDriverId: 5,
  expectedStatus: 'Planifiée',
  existingAttachments: [],
}

test('editing a multi-technician mission updates it by ID without creating a duplicate', async () => {
  const { missions, calls, fetcher } = createStore()
  const events = []

  await submitMissionEdit({
    save: () => updateMissionWith(fetcher, editParams),
    closeDrawer: () => events.push('close'),
    refresh: async () => events.push('refresh'),
  })

  assert.equal(calls.filter((c) => c.method === 'POST' && c.path === '/missions').length, 0)
  assert.deepEqual(calls.map((c) => `${c.method} ${c.path}`), ['PATCH /missions/41'])
  assert.equal(missions.length, 2)
  const updated = missions.find((m) => m.id === 41)
  assert.equal(updated.title, 'Maintenance autoclave (corrigée)')
  assert.deepEqual(updated.employeeUserIds, [4, 5, 2])
  assert.equal(updated.driverUserId, 5)
  assert.equal(updated.vehicleId, 3)
  assert.deepEqual(events, ['close', 'refresh'])
})

test('a 409 conflict shows the conflict message and keeps the drawer open', async () => {
  const { missions, fetcher } = createStore({ conflict: true })
  const events = []

  await assert.rejects(
    submitMissionEdit({
      save: () => updateMissionWith(fetcher, editParams),
      closeDrawer: () => events.push('close'),
      refresh: async () => events.push('refresh'),
    }),
    /^Error: Conflit \(409\) : La mission a été modifiée par un autre utilisateur\.$/,
  )
  assert.deepEqual(events, [])
  assert.equal(missions.length, 2)
  assert.deepEqual(missions.find((m) => m.id === 41).employeeUserIds, [4, 5])
})
