// Mode démonstration UI — DÉVELOPPEMENT UNIQUEMENT.
// Chargé seulement si `import.meta.env.DEV` ET `VITE_UI_DEMO=true` (voir main.jsx).
// Il intercepte les appels vers l'API pour permettre la vérification visuelle des écrans
// quand le backend NestJS / SQL Server n'est pas joignable. Il n'est jamais inclus dans le
// build de production et ne modifie ni le backend, ni les Guards JWT, ni les API réelles.

const today = new Date()
const iso = (offsetDays = 0) => {
  const d = new Date(today)
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

const ROLES_BY_LOGIN = {
  admin: 'Administrateur',
  coord: 'Coordinateur',
  tech: 'Technicien',
}

const users = [
  { id: 1, name: 'Sami Ben Ali', username: 'sbenali', email: 's.benali@somacs.tn', role: 'Administrateur', department: 'Direction', isActive: true, lastLogin: `${iso(0)}T08:12:00Z` },
  { id: 2, name: 'Nour Trabelsi', username: 'ntrabelsi', email: 'n.trabelsi@somacs.tn', role: 'Responsable technicien', department: 'Technique', isActive: true, lastLogin: `${iso(0)}T07:45:00Z` },
  { id: 3, name: 'Karim Jaziri', username: 'kjaziri', email: 'k.jaziri@somacs.tn', role: 'Coordinateur', department: 'Coordination', isActive: true, lastLogin: `${iso(-1)}T16:30:00Z` },
  { id: 4, name: 'Mehdi Gharbi', username: 'mgharbi', email: 'm.gharbi@somacs.tn', role: 'Technicien', department: 'Technique', isActive: true, lastLogin: `${iso(0)}T06:58:00Z` },
  { id: 5, name: 'Yassine Haddad', username: 'yhaddad', email: 'y.haddad@somacs.tn', role: 'Technicien', department: 'Technique', isActive: true, lastLogin: `${iso(-2)}T09:10:00Z` },
  { id: 6, name: 'Amine Khelifi', username: 'akhelifi', email: 'a.khelifi@somacs.tn', role: 'Technicien', department: 'Technique', isActive: false, lastLogin: null },
]

const clients = [
  { id: 1, code: 'CL-0012', name: 'Clinique Les Oliviers', type: 'Clinique', zone: 'Sfax', city: 'Sfax', phone: '74 410 220', email: 'contact@oliviers.tn', address: 'Route de Tunis km 3' },
  { id: 2, code: 'CL-0027', name: 'Laboratoire Pasteur Nord', type: 'Laboratoire', zone: 'Tunis', city: 'Ariana', phone: '71 860 114', email: 'labo@pasteurnord.tn', address: 'Av. Habib Bourguiba' },
  { id: 3, code: 'CL-0034', name: 'Hôpital Régional Gabès', type: 'Hôpital', zone: 'Sud', city: 'Gabès', phone: '75 270 900', email: 'dg@hrgabes.tn', address: 'Cité El Manara' },
  { id: 4, code: 'CL-0041', name: 'Centre Dentaire Carthage', type: 'Cabinet', zone: 'Tunis', city: 'Carthage', phone: '71 733 501', email: 'rdv@cdcarthage.tn', address: 'Rue Hannibal' },
]

const machines = [
  { id: 1, code: 'MC-101', designation: 'Autoclave classe B 23L', brand: 'Melag', model: 'Vacuklav 43B', serialNumber: 'MLG-43B-8812', category: 'Stérilisation', status: 'En service', client: 'Clinique Les Oliviers', site: 'Bloc opératoire', criticite: 'Haute', nextMaintenanceDate: iso(6), lastMaintenanceDate: iso(-84) },
  { id: 2, code: 'MC-118', designation: 'Analyseur biochimie', brand: 'Mindray', model: 'BS-240', serialNumber: 'MR-BS240-3301', category: 'Laboratoire', status: 'En panne', client: 'Laboratoire Pasteur Nord', site: 'Salle analyses', criticite: 'Critique', nextMaintenanceDate: iso(-3), lastMaintenanceDate: iso(-120) },
  { id: 3, code: 'MC-126', designation: 'Échographe portable', brand: 'GE', model: 'Vscan Air', serialNumber: 'GE-VA-1190', category: 'Imagerie', status: 'En service', client: 'Hôpital Régional Gabès', site: 'Urgences', criticite: 'Moyenne', nextMaintenanceDate: iso(28), lastMaintenanceDate: iso(-40) },
  { id: 4, code: 'MC-131', designation: 'Fauteuil dentaire', brand: 'Sirona', model: 'Intego Pro', serialNumber: 'SI-IP-7720', category: 'Dentaire', status: 'En maintenance', client: 'Centre Dentaire Carthage', site: 'Cabinet 2', criticite: 'Basse', nextMaintenanceDate: iso(14), lastMaintenanceDate: iso(-10) },
]

const vehicles = [
  { id: 1, matricule: '214 TU 5521', marque: 'Peugeot', modele: 'Partner', type: 'Utilitaire', annee: 2021, kilometrage: 84210, carburant: 'Diesel', statut: 'Disponible', disponibilite: true, assuranceExpiration: iso(40), visiteTechniqueExpiration: iso(95) },
  { id: 2, matricule: '198 TU 3307', marque: 'Renault', modele: 'Kangoo', type: 'Utilitaire', annee: 2019, kilometrage: 132870, carburant: 'Diesel', statut: 'Affecté', disponibilite: false, activeMission: { id: 1, employeeDisplay: 'Mehdi Gharbi', site: 'Clinique Les Oliviers', type: 'Maintenance' }, assuranceExpiration: iso(12), visiteTechniqueExpiration: iso(8) },
  { id: 3, matricule: '230 TU 1044', marque: 'Toyota', modele: 'Hilux', type: 'Pick-up', annee: 2023, kilometrage: 26400, carburant: 'Diesel', statut: 'En maintenance', disponibilite: false, assuranceExpiration: iso(210), visiteTechniqueExpiration: iso(300) },
]

const missionSeed = [
  ['Maintenance préventive autoclave', 'Maintenance', 'Haute', 'En cours', 0, 4, 1, 'Clinique Les Oliviers'],
  ['Panne analyseur biochimie', 'Dépannage', 'Critique', 'À faire', 0, 5, 2, 'Laboratoire Pasteur Nord'],
  ['Installation échographe', 'Installation', 'Moyenne', 'Terminée', -2, 4, 1, 'Hôpital Régional Gabès'],
  ['Contrôle fauteuil dentaire', 'Maintenance', 'Basse', 'Terminée', -5, 5, null, 'Centre Dentaire Carthage'],
  ['Calibration analyseur', 'Calibration', 'Haute', 'Bloquée', -1, 4, 2, 'Laboratoire Pasteur Nord'],
  ['Formation utilisateurs autoclave', 'Formation', 'Moyenne', 'À faire', 3, 5, 3, 'Clinique Les Oliviers'],
  ['Remplacement sonde échographe', 'Dépannage', 'Haute', 'En cours', 1, 4, 1, 'Hôpital Régional Gabès'],
  ['Visite préventive trimestrielle', 'Maintenance', 'Moyenne', 'À faire', 6, 5, null, 'Centre Dentaire Carthage'],
]

const missions = missionSeed.map(([title, type, priority, status, offset, employeeUserId, vehicleId, site], index) => {
  const employee = users.find((u) => u.id === employeeUserId)
  const vehicle = vehicles.find((v) => v.id === vehicleId) || null
  return {
    id: index + 1,
    title,
    description: `${title} — intervention planifiée chez ${site}.`,
    type,
    priority,
    status,
    dueDate: iso(offset),
    dueTime: `${String(8 + (index % 8)).padStart(2, '0')}:30`,
    employee: employee?.name ?? null,
    employeeUserId,
    employeeUser: employee ?? null,
    vehicleId,
    vehicle,
    site,
    address: clients.find((c) => c.name === site)?.address ?? null,
    notes: null,
    attachments: [],
    interventionId: status === 'Terminée' ? `INT-${1000 + index}` : null,
    createdAt: `${iso(offset - 3)}T09:00:00Z`,
    updatedAt: `${iso(offset)}T12:00:00Z`,
  }
})

const interventions = missions.map((mission, index) => {
  const client = clients.find((c) => c.name === mission.site) || null
  const machine = machines.find((m) => m.client === mission.site) || null
  return {
    id: `INT-${1000 + index}`,
    ficheNumber: `FI-2026-${String(410 + index).padStart(4, '0')}`,
    status: mission.status === 'Terminée' ? 'CLOSED' : ['PENDING', 'ASSIGNED', 'IN_PROGRESS'][index % 3],
    priority: mission.priority,
    technicianName: mission.employee,
    assignedTo: mission.employee,
    interventionDate: mission.dueDate,
    startTime: '09:00',
    endTime: '11:30',
    totalTime: '02:30',
    siteName: mission.site,
    requestorName: 'Service biomédical',
    problemDescription: mission.description,
    interventionType: mission.type,
    clientEntity: client,
    machineEntity: machine,
    client: client?.name,
    machine: machine?.designation,
    completedUpToSection: mission.status === 'Terminée' ? 6 : 2,
    parts: [],
    createdAt: `${mission.dueDate}T08:00:00Z`,
  }
})

const notifications = [
  { id: 1, title: 'Nouvelle mission affectée', message: 'Panne analyseur biochimie — Laboratoire Pasteur Nord', type: 'mission', isRead: false, createdAt: `${iso(0)}T08:40:00Z` },
  { id: 2, title: 'Mission bloquée', message: 'Calibration analyseur : pièce manquante', type: 'mission', isRead: false, createdAt: `${iso(-1)}T15:05:00Z` },
  { id: 3, title: 'Fiche signée', message: 'Installation échographe — signature client reçue', type: 'intervention', isRead: true, createdAt: `${iso(-2)}T17:20:00Z` },
]

const collections = { users, clients, machines, vehicles, missions, interventions, notifications }

function base64Url(value) {
  return btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })
}

const AUDIT_TEMPLATES = [
  { action: 'UPDATE_INTERVENTION', entity: 'INTERVENTION', description: 'Clôture de l\'intervention INT-2041 — autoclave Melag remis en service' },
  { action: 'USE_AI_ASSISTANT', entity: 'MACHINE', description: 'Diagnostic IA : erreur E12 pompe à vide sur MC-101' },
  { action: 'UPDATE_MISSION', entity: 'MISSION', description: 'Mission MS-318 passée au statut « En cours »' },
  { action: 'CREATE_MACHINE', entity: 'MACHINE', description: 'Ajout de l\'analyseur Mindray BS-240 au parc client' },
  { action: 'ASSIGN_USER_INTERVENTION', entity: 'INTERVENTION', description: 'Affectation d\'un technicien sur l\'intervention INT-2046' },
  { action: 'CREATE_MISSION', entity: 'MISSION', description: 'Création de la mission préventive Clinique Les Oliviers' },
  { action: 'UPDATE_MACHINE', entity: 'MACHINE', description: 'Mise à jour de la date de prochaine maintenance MC-126' },
  { action: 'CREATE_INTERVENTION', entity: 'INTERVENTION', description: 'Ouverture d\'une intervention corrective — échographe GE' },
  { action: 'DELETE_MISSION', entity: 'MISSION', description: 'Suppression d\'une mission en doublon' },
  { action: 'UPDATE_INTERVENTION', entity: 'INTERVENTION', description: 'Ajout des pièces remplacées et du rapport technicien' },
  { action: 'DELETE_MACHINE', entity: 'MACHINE', description: 'Retrait du parc : fauteuil dentaire réformé' },
  { action: 'UPDATE_MISSION', entity: 'MISSION', description: 'Replanification de la mission MS-322' },
]
const TECH_AUDIT_ACTIONS = ['UPDATE_MISSION', 'UPDATE_INTERVENTION', 'ASSIGN_USER_INTERVENTION', 'USE_AI_ASSISTANT']

function demoAuditLogs(userId, query) {
  const user = users.find((u) => u.id === userId)
  if (!user || !user.isActive) return []
  const templates = user.role === 'Technicien'
    ? AUDIT_TEMPLATES.filter((t) => TECH_AUDIT_ACTIONS.includes(t.action))
    : AUDIT_TEMPLATES
  const start = query?.get('dateStart') ? new Date(`${query.get('dateStart')}T00:00:00`) : null
  const end = query?.get('dateEnd') ? new Date(`${query.get('dateEnd')}T23:59:59`) : null
  const now = Date.now()
  const logs = []
  for (let i = 0; i < 46; i += 1) {
    const template = templates[(i * 7 + userId) % templates.length]
    const createdAt = new Date(now - i * 15.5 * 3600000 - ((i * 37) % 60) * 60000)
    if (start && createdAt < start) continue
    if (end && createdAt > end) continue
    const entityId = 100 + ((i * 13 + userId * 5) % 80)
    const isUpdate = template.action.startsWith('UPDATE')
    logs.push({
      id: userId * 1000 + i,
      userId,
      ...template,
      entityId,
      status: i % 17 === 5 ? 'FAILED' : 'SUCCESS',
      ipAddress: `10.0.${userId}.${20 + (i % 40)}`,
      oldData: isUpdate ? { statut: 'Planifiée', priorite: 'Normale' } : null,
      newData: isUpdate ? { statut: 'En cours', priorite: i % 2 ? 'Haute' : 'Normale' } : template.action.startsWith('CREATE') ? { reference: `REF-${entityId}` } : null,
      createdAt: createdAt.toISOString(),
    })
  }
  return logs
}

function route(method, pathname, body, query) {
  const parts = pathname.split('/').filter(Boolean)
  const [resource, idOrSub, sub] = parts

  if (resource === 'auth' && idOrSub === 'login') {
    const login = String(body?.username || '').trim().toLowerCase()
    const role = ROLES_BY_LOGIN[login] || 'Responsable technicien'
    const user = users.find((u) => u.role === role) || users[1]
    const token = `${base64Url({ alg: 'none' })}.${base64Url({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 86400 })}.demo`
    return json({ accessToken: token, user })
  }
  if (resource === 'auth') return json({ ok: true })

  if (resource === 'notifications') {
    if (idOrSub === 'center') return json({ items: notifications, total: notifications.length, unreadCount: 2 })
    if (idOrSub === 'unread-count') return json({ count: 2 })
    return json(notifications)
  }

  if (resource === 'audit-logs' && idOrSub === 'user') {
    const logs = demoAuditLogs(Number(sub), query)
    if (parts[3] === 'stats') {
      const actionsByType = {}
      logs.forEach((log) => { actionsByType[log.action] = (actionsByType[log.action] || 0) + 1 })
      return json({ total: logs.length, actionsByType })
    }
    const limit = Math.max(1, Number(query?.get('limit')) || 20)
    const totalPages = Math.max(1, Math.ceil(logs.length / limit))
    const page = Math.min(totalPages, Math.max(1, Number(query?.get('page')) || 1))
    return json({ items: logs.slice((page - 1) * limit, page * limit), total: logs.length, page, totalPages })
  }

  if (resource === 'missions' && sub === 'view' && method === 'POST') {
    return json({ recorded: false, demo: true })
  }

  const collection = collections[resource]
  if (!collection) return json([])

  // Les écritures ne sont jamais simulées : l'UI doit afficher l'erreur réelle
  // plutôt qu'un faux message de succès pour une donnée non persistée.
  if (method !== 'GET') {
    return json({ message: 'Mode démonstration : opération non enregistrée (backend indisponible).' }, 503)
  }
  if (resource === 'vehicles' && idOrSub === 'stats') {
    const countBy = (statut) => vehicles.filter((v) => v.statut === statut).length
    return json({
      total: vehicles.length,
      disponibles: countBy('Disponible'),
      affectes: countBy('Affecté'),
      maintenance: countBy('En maintenance'),
      horsService: countBy('Hors service'),
    })
  }
  if (!idOrSub || idOrSub === 'summary') return json(collection)
  if (resource === 'clients' && sub === '360') {
    const client = collection.find((c) => String(c.id) === idOrSub)
    return json({ client, machines: machines.filter((m) => m.client === client?.name), missions: missions.filter((m) => m.site === client?.name), interventions: interventions.filter((i) => i.siteName === client?.name) })
  }
  const item = collection.find((entry) => String(entry.id) === idOrSub)
  if (sub) return json([])
  return item ? json(item) : json({ message: 'Not found' }, 404)
}

export function installDemoApi(apiBaseUrl) {
  const originalFetch = window.fetch.bind(window)
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url
    if (!url.startsWith(apiBaseUrl)) return originalFetch(input, init)
    const { pathname, searchParams } = new URL(url.slice(apiBaseUrl.length) || '/', 'http://demo.local')
    let body = null
    try { body = typeof init.body === 'string' ? JSON.parse(init.body) : null } catch { body = null }
    await new Promise((resolve) => setTimeout(resolve, 180))
    return route((init.method || 'GET').toUpperCase(), pathname, body, searchParams)
  }
  console.info('[SOMACS] Mode démonstration UI actif (dev uniquement). Identifiants : admin / coord / tech / autre = Responsable.')
}
