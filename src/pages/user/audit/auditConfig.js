// Référentiel partagé de la traçabilité métier (interface + rapport PDF).
// Les codes d'action proviennent du backend (audit-actions.enum.ts) et ne doivent pas changer.

export const BUSINESS_ACTIONS = [
  'CREATE_MACHINE',
  'UPDATE_MACHINE',
  'DELETE_MACHINE',
  'CREATE_MISSION',
  'UPDATE_MISSION',
  'DELETE_MISSION',
  'CREATE_INTERVENTION',
  'UPDATE_INTERVENTION',
  'ASSIGN_USER_INTERVENTION',
  'USE_AI_ASSISTANT',
  'ASSIGN_MISSION',
  'REASSIGN_MISSION',
  'CHANGE_STATUS_MISSION',
  'VIEW_MISSION',
  'DELETE_INTERVENTION',
  'CLOSE_INTERVENTION',
  'SIGN_INTERVENTION',
  'DOWNLOAD_PDF_INTERVENTION',
  'CREATE_CLIENT',
  'UPDATE_CLIENT',
  'DELETE_CLIENT',
  'CREATE_VEHICLE',
  'UPDATE_VEHICLE',
  'DELETE_VEHICLE',
  'CREATE_USER',
  'UPDATE_USER',
  'CHANGE_STATUS_USER',
  'DELETE_USER',
]

export const TECHNICIEN_ACTIONS = [
  'UPDATE_MISSION',
  'CHANGE_STATUS_MISSION',
  'VIEW_MISSION',
  'CREATE_INTERVENTION',
  'UPDATE_INTERVENTION',
  'CLOSE_INTERVENTION',
  'SIGN_INTERVENTION',
  'DOWNLOAD_PDF_INTERVENTION',
  'ASSIGN_USER_INTERVENTION',
  'USE_AI_ASSISTANT',
]

export const ACTION_LABELS = {
  CREATE_MACHINE: 'Création machine',
  UPDATE_MACHINE: 'Modification machine',
  DELETE_MACHINE: 'Suppression machine',
  CREATE_MISSION: 'Création mission',
  UPDATE_MISSION: 'Modification mission',
  DELETE_MISSION: 'Suppression mission',
  CREATE_INTERVENTION: 'Création intervention',
  UPDATE_INTERVENTION: 'Modification intervention',
  ASSIGN_USER_INTERVENTION: 'Affectation utilisateur',
  USE_AI_ASSISTANT: 'Assistant IA',
  ASSIGN_MISSION: 'Affectation mission',
  REASSIGN_MISSION: 'Réaffectation mission',
  CHANGE_STATUS_MISSION: 'Changement de statut mission',
  VIEW_MISSION: 'Consultation mission',
  DELETE_INTERVENTION: 'Suppression intervention',
  CLOSE_INTERVENTION: 'Clôture intervention',
  SIGN_INTERVENTION: 'Signature intervention',
  DOWNLOAD_PDF_INTERVENTION: 'Téléchargement PDF intervention',
  CREATE_CLIENT: 'Création client',
  UPDATE_CLIENT: 'Modification client',
  DELETE_CLIENT: 'Suppression client',
  CREATE_VEHICLE: 'Création véhicule',
  UPDATE_VEHICLE: 'Modification véhicule',
  DELETE_VEHICLE: 'Suppression véhicule',
  CREATE_USER: 'Création utilisateur',
  UPDATE_USER: 'Modification utilisateur',
  CHANGE_STATUS_USER: 'Changement de statut utilisateur',
  DELETE_USER: 'Suppression utilisateur',
}

/** Familles d'opérations, utilisées pour les filtres, la timeline et les couleurs. */
export const OPERATIONS = {
  create: { label: 'Création', tone: 'teal', dot: 'bg-teal-500', soft: 'bg-teal-50 text-teal-800 ring-teal-200', rgb: [13, 148, 136] },
  update: { label: 'Modification', tone: 'brand', dot: 'bg-brand-600', soft: 'bg-brand-50 text-brand-700 ring-brand-200', rgb: [37, 99, 235] },
  delete: { label: 'Suppression', tone: 'red', dot: 'bg-red-500', soft: 'bg-red-50 text-red-700 ring-red-200', rgb: [220, 38, 38] },
  assign: { label: 'Affectation', tone: 'amber', dot: 'bg-amber-500', soft: 'bg-amber-50 text-amber-800 ring-amber-200', rgb: [217, 119, 6] },
  ai: { label: 'Assistant IA', tone: 'navy', dot: 'bg-navy', soft: 'bg-slate-100 text-navy ring-slate-300', rgb: [11, 21, 48] },
}

export function operationFromAction(action) {
  const code = String(action || '')
  if (code === 'USE_AI_ASSISTANT') return 'ai'
  if (code.startsWith('CREATE_')) return 'create'
  if (code.startsWith('DELETE_')) return 'delete'
  if (code.startsWith('ASSIGN_') || code.startsWith('REASSIGN_')) return 'assign'
  return 'update'
}

export const MODULES = ['Parc Machine', 'Parc Machine - Assistant IA', 'Missions', 'Interventions', 'Clients', 'Véhicules', 'Utilisateurs']

export const MODULE_SHORT_LABELS = {
  'Parc Machine': 'Parc machines',
  'Parc Machine - Assistant IA': 'Assistant IA',
  Missions: 'Missions',
  Interventions: 'Interventions',
  Clients: 'Clients',
  Véhicules: 'Véhicules',
  Utilisateurs: 'Utilisateurs',
}

export function moduleFromLog(log) {
  if (log?.action === 'USE_AI_ASSISTANT') return 'Parc Machine - Assistant IA'
  if (log?.entity === 'MACHINE') return 'Parc Machine'
  if (log?.entity === 'MISSION') return 'Missions'
  if (log?.entity === 'INTERVENTION') return 'Interventions'
  const extra = { CLIENT: 'Clients', VEHICLE: 'Véhicules', USER: 'Utilisateurs' }
  return extra[log?.entity] || log?.entity || '-'
}

export function getDescriptionLabel(action, description) {
  if (description && description.length > 0 && description !== '-') return description
  return ACTION_LABELS[action] || action
}

export function formatCountMessage(count, zeroMsg, oneMsg, pluralTemplate) {
  if (count === 0) return zeroMsg
  if (count === 1) return oneMsg
  return pluralTemplate.replace('{n}', String(count))
}

export function countsFromStats(stats) {
  const map = stats?.actionsByType || {}
  return {
    ai: Number(map.USE_AI_ASSISTANT || 0),
    machineCreate: Number(map.CREATE_MACHINE || 0),
    machineUpdate: Number(map.UPDATE_MACHINE || 0),
    machineDelete: Number(map.DELETE_MACHINE || 0),
    missionCreate: Number(map.CREATE_MISSION || 0),
    missionUpdate: Number(map.UPDATE_MISSION || 0),
    missionDelete: Number(map.DELETE_MISSION || 0),
    interventionCreate: Number(map.CREATE_INTERVENTION || 0),
    interventionUpdate: Number(map.UPDATE_INTERVENTION || 0),
    interventionAssign: Number(map.ASSIGN_USER_INTERVENTION || 0),
    ...aggregateAllActions(map),
  }
}

// Totaux calculés sur toutes les actions métier connues (missions, clients,
// véhicules, utilisateurs, signatures…) et non plus sur une liste figée.
function aggregateAllActions(map) {
  const byOperation = { create: 0, update: 0, delete: 0, assign: 0, ai: 0 }
  let total = 0
  for (const [action, value] of Object.entries(map)) {
    if (!ACTION_LABELS[action]) continue
    const n = Number(value || 0)
    byOperation[operationFromAction(action)] += n
    total += n
  }
  return { total, byOperation }
}

export function totalFromCounts(counts) {
  return counts.total
}

/** Répartition par famille d'opération (création, modification, …) à partir des compteurs serveur. */
export function operationTotals(counts) {
  return counts.byOperation
}

/**
 * Synthèse rédigée par module — mêmes constats que l'ancienne interface, selon le rôle.
 * Retourne [{ key, title, value, lines: string[], note? }]
 */
export function buildModuleInsights(counts, isTechnicien) {
  if (isTechnicien) {
    const missionLines = counts.missionUpdate === 0 && counts.interventionAssign === 0
      ? ["Aucun changement d'état de mission n'a été enregistré durant cette période."]
      : [
          counts.interventionAssign > 0 && `Missions affectées au technicien : ${counts.interventionAssign}`,
          counts.missionUpdate > 0 && `Missions dont le statut a été changé par le technicien : ${counts.missionUpdate}`,
        ].filter(Boolean)
    const interventionLines = counts.interventionUpdate === 0 && counts.interventionAssign === 0
      ? ["Aucune clôture ou modification d'intervention n'a été détectée durant cette période."]
      : [
          counts.interventionAssign > 0 && `Interventions affectées au technicien : ${counts.interventionAssign}`,
          counts.interventionUpdate > 0 && `Interventions modifiées par le technicien : ${counts.interventionUpdate}`,
        ].filter(Boolean)
    return [
      {
        key: 'ai',
        title: 'Assistant IA',
        value: counts.ai,
        lines: [counts.ai === 0
          ? "L'Assistant IA de diagnostic n'a pas été utilisé durant cette période."
          : `Nombre d'utilisations de l'Assistant IA diagnostic : ${counts.ai}`],
      },
      {
        key: 'missions',
        title: 'Missions',
        value: counts.missionUpdate + counts.interventionAssign,
        lines: missionLines,
        note: counts.missionUpdate === 0 && counts.interventionAssign === 0
          ? null
          : 'Changements d’état possibles : À faire › En cours, En cours › Terminée, En cours › Bloquée',
      },
      {
        key: 'interventions',
        title: 'Interventions',
        value: counts.interventionUpdate + counts.interventionAssign,
        lines: interventionLines,
      },
    ]
  }

  return [
    {
      key: 'ai',
      title: 'Assistant IA',
      value: counts.ai,
      lines: [counts.ai === 0
        ? "L'Assistant IA de diagnostic n'a pas été utilisé durant cette période."
        : counts.ai === 1
          ? "Cet utilisateur a utilisé l'Assistant IA de diagnostic 1 fois durant la période sélectionnée."
          : `Cet utilisateur a utilisé l'Assistant IA de diagnostic ${counts.ai} fois durant la période sélectionnée.`],
    },
    {
      key: 'machines',
      title: 'Parc machines',
      value: counts.machineCreate + counts.machineUpdate + counts.machineDelete,
      lines: [
        formatCountMessage(counts.machineCreate, "Aucune création de machine n'a été enregistrée durant cette période.", 'Une nouvelle machine a été créée par cet utilisateur.', '{n} créations de machines ont été enregistrées durant cette période.'),
        formatCountMessage(counts.machineUpdate, "Aucune modification de machine n'a été enregistrée durant cette période.", 'Une machine a été modifiée par cet utilisateur.', '{n} modifications de machines ont été enregistrées durant cette période.'),
        formatCountMessage(counts.machineDelete, "Aucune suppression de machine n'a été enregistrée durant cette période.", 'Une machine a été supprimée par cet utilisateur.', '{n} suppressions de machines ont été enregistrées durant cette période.'),
      ],
    },
    {
      key: 'missions',
      title: 'Missions',
      value: counts.missionCreate + counts.missionUpdate + counts.missionDelete,
      lines: [
        formatCountMessage(counts.missionCreate, "Aucune création de mission n'a été enregistrée durant cette période.", 'Une nouvelle mission a été créée par cet utilisateur.', '{n} créations de missions ont été enregistrées durant cette période.'),
        formatCountMessage(counts.missionUpdate, "Aucune modification de mission n'a été enregistrée durant cette période.", 'Une mission a été modifiée par cet utilisateur.', '{n} modifications de missions ont été enregistrées durant cette période.'),
        formatCountMessage(counts.missionDelete, "Aucune suppression de mission n'a été enregistrée durant cette période.", 'Une mission a été supprimée par cet utilisateur.', '{n} suppressions de missions ont été enregistrées durant cette période.'),
      ],
    },
    {
      key: 'interventions',
      title: 'Interventions',
      value: counts.interventionCreate + counts.interventionUpdate + counts.interventionAssign,
      lines: [
        formatCountMessage(counts.interventionCreate, "Aucune création d'intervention n'a été enregistrée durant cette période.", 'Une nouvelle intervention a été créée par cet utilisateur.', "{n} créations d'interventions ont été enregistrées durant cette période."),
        formatCountMessage(counts.interventionUpdate, "Aucune modification d'intervention n'a été détectée pour cette période.", 'Une intervention a été modifiée par cet utilisateur.', "{n} modifications d'interventions ont été détectées pour cette période."),
        formatCountMessage(counts.interventionAssign, "Aucune affectation d'utilisateur n'a été enregistrée durant cette période.", 'Un utilisateur a été affecté à une intervention durant cette période.', "{n} affectations d'utilisateurs ont été enregistrées durant cette période."),
      ],
    },
  ]
}

/* ── Dates ─────────────────────────────────────────────────────────────── */

export function formatDateToISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function formatDateForDisplay(dateString) {
  if (!dateString) return '-'
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function dayKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return formatDateToISO(date)
}

export function formatDayHeading(key) {
  if (key === 'unknown') return 'Date inconnue'
  const date = new Date(`${key}T00:00:00`)
  const today = formatDateToISO(new Date())
  const yesterday = formatDateToISO(new Date(Date.now() - 86400000))
  if (key === today) return "Aujourd'hui"
  if (key === yesterday) return 'Hier'
  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Validation SQL Server : AAAA-MM-JJ, année entre 1753 et 9999. */
export function isValidDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return false
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false
  const year = parseInt(match[1], 10)
  if (year < 1753 || year > 9999) return false
  return !Number.isNaN(new Date(`${dateStr}T00:00:00`).getTime())
}

export const PERIOD_PRESETS = [
  { key: '7d', label: '7 jours', range: (now) => [new Date(now.getTime() - 6 * 86400000), now] },
  { key: '30d', label: '30 jours', range: (now) => [new Date(now.getTime() - 29 * 86400000), now] },
  { key: 'month', label: 'Ce mois', range: (now) => [getStartOfMonth(now), now] },
  {
    key: 'last-month',
    label: 'Mois précédent',
    range: (now) => [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)],
  },
]
