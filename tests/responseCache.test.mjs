import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createResponseCache, findRule } from '../src/api/responseCache.js'

function setup() {
  let clock = 1_000_000
  const cache = createResponseCache({ now: () => clock, maxEntries: 5 })
  const calls = []
  const fetcher = (path, payload = { path }, status = 200) => () => {
    calls.push(path)
    return Promise.resolve(new Response(JSON.stringify(payload), { status }))
  }
  return { cache, calls, fetcher, advance: (ms) => { clock += ms } }
}

const USER_A = 'token-admin'
const USER_B = 'token-technicien'

test('1-2. premier appel réseau, second appel servi par le cache', async () => {
  const { cache, calls, fetcher } = setup()
  const r1 = await cache.get('/machines', USER_A, fetcher('/machines'))
  const r2 = await cache.get('/machines', USER_A, fetcher('/machines'))
  assert.equal(calls.length, 1)
  assert.deepEqual(await r1.json(), await r2.json())
  assert.equal(cache.getStats().hits, 1)
})

test('3. filtres/pages/recherche = clés distinctes', async () => {
  const { cache, calls, fetcher } = setup()
  await cache.get('/clients?page=1', USER_A, fetcher('p1'))
  await cache.get('/clients?page=2', USER_A, fetcher('p2'))
  await cache.get('/clients?search=abc', USER_A, fetcher('s'))
  await cache.get('/clients?page=1', USER_A, fetcher('p1'))
  assert.deepEqual(calls, ['p1', 'p2', 's'])
})

for (const resource of ['/machines', '/clients', '/vehicles']) {
  test(`4. mutation ${resource} invalide liste et détail`, async () => {
    const { cache, calls, fetcher } = setup()
    await cache.get(resource, USER_A, fetcher('list'))
    await cache.get(`${resource}/7`, USER_A, fetcher('detail'))
    cache.invalidateForMutation(`${resource}/7`)
    await cache.get(resource, USER_A, fetcher('list'))
    await cache.get(`${resource}/7`, USER_A, fetcher('detail'))
    assert.deepEqual(calls, ['list', 'detail', 'list', 'detail'])
  })
}

test('5. expiration du TTL -> nouvelle récupération', async () => {
  const { cache, calls, fetcher, advance } = setup()
  await cache.get('/clients', USER_A, fetcher('c'))
  advance(89_000)
  await cache.get('/clients', USER_A, fetcher('c'))
  assert.equal(calls.length, 1)
  advance(2_000)
  await cache.get('/clients', USER_A, fetcher('c'))
  assert.equal(calls.length, 2)
})

test('6. changement d utilisateur -> aucune fuite', async () => {
  const { cache, calls, fetcher } = setup()
  await cache.get('/clients', USER_A, fetcher('A', { owner: 'A' }))
  const rb = await cache.get('/clients', USER_B, fetcher('B', { owner: 'B' }))
  assert.deepEqual(await rb.json(), { owner: 'B' })
  assert.equal(calls.length, 2)
})

test('6b. clear() (déconnexion) vide tout', async () => {
  const { cache, calls, fetcher } = setup()
  await cache.get('/machines', USER_A, fetcher('m'))
  cache.clear()
  await cache.get('/machines', USER_A, fetcher('m'))
  assert.equal(calls.length, 2)
})

test('7. disponibilité véhicule jamais mise en cache', async () => {
  const { cache, calls, fetcher } = setup()
  await cache.get('/vehicles/available', USER_A, fetcher('a'))
  await cache.get('/vehicles/available', USER_A, fetcher('a'))
  await cache.get('/vehicles/stats', USER_A, fetcher('s'))
  await cache.get('/vehicles/stats', USER_A, fetcher('s'))
  assert.equal(calls.length, 4)
})

test('7b. mutation mission invalide les véhicules (affectation)', async () => {
  const { cache, calls, fetcher } = setup()
  await cache.get('/vehicles', USER_A, fetcher('v'))
  cache.invalidateForMutation('/missions/12')
  await cache.get('/vehicles', USER_A, fetcher('v'))
  assert.equal(calls.length, 2)
})

test('8. routes sensibles jamais cachées', () => {
  for (const path of [
    '/missions', '/missions/3', '/interventions/3/pdf', '/interventions/3/signatures',
    '/audit-logs/user/1', '/users', '/notifications', '/auth/me',
    '/clients/4/360', '/machines/summary',
  ]) {
    assert.equal(findRule(path), null, path)
  }
})

test('9. erreurs (401/403/500) jamais conservées', async () => {
  const { cache, calls, fetcher } = setup()
  for (const status of [401, 403, 500]) {
    await cache.get('/machines', USER_A, fetcher('m', { error: true }, status))
  }
  await cache.get('/machines', USER_A, fetcher('m'))
  assert.equal(calls.length, 4)
})

test('9b. sans token, aucun cache', async () => {
  const { cache, calls, fetcher } = setup()
  await cache.get('/machines', null, fetcher('m'))
  await cache.get('/machines', null, fetcher('m'))
  assert.equal(calls.length, 2)
})

test('requêtes identiques simultanées dédupliquées', async () => {
  const { cache, calls, fetcher } = setup()
  const [a, b] = await Promise.all([
    cache.get('/roles', USER_A, fetcher('r')),
    cache.get('/roles', USER_A, fetcher('r')),
  ])
  assert.equal(calls.length, 1)
  assert.deepEqual(await a.json(), await b.json())
})

test('mémoire bornée (LRU)', async () => {
  const { cache, fetcher } = setup()
  for (let i = 0; i < 12; i += 1) {
    await cache.get(`/machines/${i}`, USER_A, fetcher(String(i)))
  }
  assert.equal(cache.getStats().size, 5)
})
