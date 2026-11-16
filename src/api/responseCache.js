// Cache mémoire (jamais persistant) des réponses GET pour des données de référence stables.
// SQL Server reste la source de vérité : le cache n'est qu'un raccourci de lecture,
// les contrôles métier (ex. disponibilité véhicule) sont refaits côté Backend.

const SECOND = 1000

// Seules ces routes sont mises en cache. Toute route absente de cette liste
// (missions, interventions, signatures, PDF, audit, notifications, users...) n'est jamais cachée.
export const CACHE_RULES = [
  {
    prefix: '/machines',
    ttlMs: 150 * SECOND,
    // summary = statistiques ; diagnostic-ai = POST de calcul
    exclude: [/^\/machines\/(summary|diagnostic-ai)/],
  },
  {
    prefix: '/clients',
    ttlMs: 90 * SECOND,
    // Fiche 360° : statistiques qui doivent rester exactes
    exclude: [/^\/clients\/[^/]+\/360/],
  },
  {
    prefix: '/vehicles',
    ttlMs: 90 * SECOND,
    // Disponibilité et statistiques : toujours fraîches
    exclude: [/^\/vehicles\/(available|stats)/],
  },
  { prefix: '/roles', ttlMs: 300 * SECOND, exclude: [] },
]

// Une mutation sur la ressource de gauche invalide aussi celles de droite.
// Une mission/intervention peut changer le statut d'un véhicule ou l'historique d'une machine/client.
const RELATED_INVALIDATIONS = {
  '/missions': ['/vehicles', '/clients', '/machines'],
  '/interventions': ['/machines', '/clients'],
  '/users': ['/roles'],
}

const MAX_ENTRIES = 100

function resourcePrefix(path) {
  const match = /^\/[^/?]+/.exec(path)
  return match ? match[0] : path
}

export function findRule(path) {
  const rule = CACHE_RULES.find(
    (r) => path === r.prefix || path.startsWith(`${r.prefix}/`) || path.startsWith(`${r.prefix}?`),
  )
  if (!rule) return null
  if (rule.exclude.some((pattern) => pattern.test(path))) return null
  return rule
}

export function createResponseCache({ now = () => Date.now(), maxEntries = MAX_ENTRIES } = {}) {
  const entries = new Map()
  const inflight = new Map()
  let scope = null
  const stats = { hits: 0, misses: 0, invalidations: 0 }

  function setScope(nextScope) {
    if (nextScope !== scope) {
      entries.clear()
      inflight.clear()
      scope = nextScope
    }
  }

  function toResponse(entry) {
    return new Response(entry.body, {
      status: entry.status,
      statusText: entry.statusText,
      headers: entry.headers,
    })
  }

  function store(key, entry) {
    entries.delete(key)
    entries.set(key, entry)
    while (entries.size > maxEntries) {
      entries.delete(entries.keys().next().value)
    }
  }

  async function get(path, userScope, fetcher) {
    setScope(userScope)
    const rule = findRule(path)
    if (!rule || !userScope) return fetcher()

    const key = path
    const cached = entries.get(key)
    if (cached && cached.expiresAt > now()) {
      stats.hits += 1
      return toResponse(cached)
    }
    if (cached) entries.delete(key)

    const pending = inflight.get(key)
    if (pending) {
      stats.hits += 1
      return toResponse(await pending)
    }

    stats.misses += 1
    const requestScope = scope
    const promise = (async () => {
      const response = await fetcher()
      const body = await response.clone().text()
      const entry = {
        body,
        status: response.status,
        statusText: response.statusText,
        headers: [...response.headers.entries()],
        expiresAt: now() + rule.ttlMs,
      }
      // Erreurs (4xx/5xx) jamais conservées ; résultat ignoré si l'utilisateur a changé entre-temps.
      if (response.ok && requestScope === scope) store(key, entry)
      return entry
    })()

    inflight.set(key, promise)
    try {
      return toResponse(await promise)
    } finally {
      if (inflight.get(key) === promise) inflight.delete(key)
    }
  }

  function invalidateForMutation(path) {
    const prefix = resourcePrefix(path)
    const targets = [prefix, ...(RELATED_INVALIDATIONS[prefix] || [])]
    for (const key of [...entries.keys()]) {
      if (targets.includes(resourcePrefix(key))) {
        entries.delete(key)
        stats.invalidations += 1
      }
    }
    for (const key of [...inflight.keys()]) {
      if (targets.includes(resourcePrefix(key))) inflight.delete(key)
    }
  }

  function clear() {
    entries.clear()
    inflight.clear()
    scope = null
  }

  return {
    get,
    invalidateForMutation,
    clear,
    getStats: () => ({ ...stats, size: entries.size }),
  }
}

export const responseCache = createResponseCache()
