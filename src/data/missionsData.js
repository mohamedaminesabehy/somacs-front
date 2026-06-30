import { AlertCircle, Package, ClipboardList, Wrench } from 'lucide-react'
import {
  MISSION_PRIORITY_COLORS,
  MISSION_STATUS_COLORS,
  MISSION_STATUS_LIST,
  getMissionStatusColorKey,
} from '../constants/missionConstants'

// ─── Interventions ────────────────────────────────────────────────────────────
const interventionColumns = [
  'id',
  'client',
  'machine',
  'type',
  'status',
  'statusLabel',
  'date',
  'phone',
  'clientCode',
  'address',
  'request',
  'assignedTo',
]

const makeInterventionRow = (values) =>
  Object.fromEntries(interventionColumns.map((key, index) => [key, values[index]]))

export const interventionsList = [
  ['INT-2026-001', 'Garage Central', 'Pont Élévateur 4T', 'Réparation', 'IN_PROGRESS', 'En cours', '01/03/2026', '99184688', 'CLT-882', 'Zone Industrielle Est, Tunis', 'Fuite hydraulique vérin gauche - Intervention urgente demandée.', 'Jean Dupont'],
  ['INT-2026-002', 'Usine MetalPlus', 'Compresseur Industriel', 'Installation', 'PENDING', 'En attente', '02/03/2026', '71445566', 'CLT-445', 'Route de Sousse km 4, Sfax', 'Installation compresseur nouvelle ligne de production.', null],
  ['INT-2026-003', 'Logistique Express', 'Chariot Élévateur', 'Réparation', 'ASSIGNED', 'Affectée', '02/03/2026', '55667788', 'CLT-116', 'Port de Commerce, Bizerte', 'Panne système de levage - chariot bloqué.', 'Pierre Martin'],
  ['INT-2026-005', 'AgriTech SA', "Système d'Irrigation", 'Réparation', 'TESTING', 'En test', '01/03/2026', '99112233', 'CLT-512', 'Gouvernorat de Nabeul, RN 1', 'Fuite circuit principal - arrosage arrêté.', 'Marie Curie'],
  ['INT-2026-006', 'Clinique Moderne', 'Ascenseur Bloc B', 'Garantie', 'PENDING', 'En attente', '03/03/2026', '71889900', 'CLT-780', 'Avenue Habib Bourguiba, Tunis', 'Ascenseur bloqué entre 2ème et 3ème étage.', null],
  ['INT-2026-007', 'MegaDistrib SA', 'Porte Automatique', 'Réparation', 'ASSIGNED', 'Affectée', '03/03/2026', '55443322', 'CLT-331', 'Zone Logistique Sud, Sousse', 'Motorisation porte - blocage à 70% de course.', 'Sarah Martin'],
].map(makeInterventionRow)

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const statusList = MISSION_STATUS_LIST
export const priorityColors = MISSION_PRIORITY_COLORS
export const statusColors = MISSION_STATUS_COLORS
export const getStatusColor = getMissionStatusColorKey

// ─── Shared mission store (single source of truth for all pages) ──────────────
const _initialMissions = [
  {
    id: 1,
    icon: AlertCircle,
    title: 'Réparation urgente pompe hydraulique',
    description: 'Intervention client prioritaire - Site Marseille',
    employeeId: 1,
    employee: 'Jean Dupont',
    avatar: 'JD',
    priority: 'Critique',
    priorityColor: 'red',
    status: 'En cours',
    statusColor: 'yellow',
    dueDate: "Aujourd'hui",
    dueTime: '18:00',
    duration: '4h',
    type: 'Normal',
    interventionId: null,
    site: 'Site Marseille',
    address: '12 rue des Usines, Marseille',
    notes: 'Accès par la porte de service - demander M. Bernard à l\'accueil.',
  },
  {
    id: 2,
    icon: Package,
    title: 'Inventaire pièces détachées Q4',
    description: 'Vérification stock et mise à jour base de données',
    employeeId: 1,
    employee: 'Jean Dupont',
    avatar: 'JD',
    priority: 'Haute',
    priorityColor: 'orange',
    status: 'À faire',
    statusColor: 'blue',
    dueDate: '10 Mars 2026',
    dueTime: '10:00',
    duration: '6h',
    type: 'Normal',
    interventionId: null,
    site: 'Dépôt Central',
    address: 'Zone Industrielle Nord, Entrepôt B2',
    notes: '',
  },
  {
    id: 3,
    icon: ClipboardList,
    title: 'Rédaction rapport mensuel',
    description: 'Synthèse activités et KPIs du mois de février',
    employeeId: 1,
    employee: 'Jean Dupont',
    avatar: 'JD',
    priority: 'Moyenne',
    priorityColor: 'gray',
    status: 'Terminée',
    statusColor: 'green',
    dueDate: '05 Mars 2026',
    dueTime: '14:00',
    duration: '3h',
    type: 'Normal',
    interventionId: null,
    site: 'Bureau SOMACS',
    address: '',
    notes: '',
  },
  {
    id: 4,
    icon: AlertCircle,
    title: 'Installation nouveau système CRM',
    description: 'En attente validation direction',
    employeeId: 1,
    employee: 'Jean Dupont',
    avatar: 'JD',
    priority: 'Haute',
    priorityColor: 'orange',
    status: 'Bloquée',
    statusColor: 'red',
    dueDate: '15 Mars 2026',
    dueTime: '09:00',
    duration: '12h',
    type: 'Normal',
    interventionId: null,
    site: 'Siège Social',
    address: 'Avenue Principale, Tunis',
    notes: 'En attente du bon de commande signé par la direction.',
  },
  {
    id: 5,
    icon: Wrench,
    title: 'Réparation Pont Élévateur - Garage Central',
    description: 'Intervention liée au dossier INT-2026-001',
    employeeId: 1,
    employee: 'Jean Dupont',
    avatar: 'JD',
    priority: 'Critique',
    priorityColor: 'red',
    status: 'En cours',
    statusColor: 'yellow',
    dueDate: "Aujourd'hui",
    dueTime: '08:30',
    duration: '4h',
    type: 'Intervention',
    interventionId: 'INT-2026-001',
    site: 'Garage Central',
    address: 'Zone Industrielle Est, Tunis',
    notes: 'Prévoir kit joints hydrauliques référence HYD-4400.',
  },
  {
    id: 6,
    icon: Wrench,
    title: 'Réparation Chariot Élévateur - Logistique Express',
    description: 'Intervention liée au dossier INT-2026-003',
    employeeId: 2,
    employee: 'Pierre Martin',
    avatar: 'PM',
    priority: 'Haute',
    priorityColor: 'orange',
    status: 'À faire',
    statusColor: 'blue',
    dueDate: '09 Mars 2026',
    dueTime: '09:00',
    duration: '3h',
    type: 'Intervention',
    interventionId: 'INT-2026-003',
    site: 'Logistique Express',
    address: 'Port de Commerce, Bizerte',
    notes: '',
  },
  {
    id: 7,
    icon: Wrench,
    title: 'Maintenance Porte Automatique - MegaDistrib SA',
    description: 'Intervention liée au dossier INT-2026-007',
    employeeId: 3,
    employee: 'Sarah Martin',
    avatar: 'SM',
    priority: 'Moyenne',
    priorityColor: 'gray',
    status: 'À faire',
    statusColor: 'blue',
    dueDate: '10 Mars 2026',
    dueTime: '10:00',
    duration: '2h',
    type: 'Intervention',
    interventionId: 'INT-2026-007',
    site: 'MegaDistrib SA',
    address: 'Zone Logistique Sud, Sousse',
    notes: '',
  },
]

// In-memory store with getter/updater so all pages share state
let _store = [..._initialMissions]

export function getMissionStore() {
  return _store
}

export function updateMissionInStore(updated) {
  _store = _store.map((m) => (m.id === updated.id ? updated : m))
}

export function addMissionToStore(mission) {
  const nextId = _store.length ? Math.max(..._store.map((m) => m.id)) + 1 : 1
  const newMission = { ..._store[0], ...mission, id: nextId }
  _store = [newMission, ..._store]
  return newMission
}

export { _initialMissions as initialMissions }
