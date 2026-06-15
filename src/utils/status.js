/**
 * Utilitaires de statut partagés (missions).
 * Centralise les correspondances statut → couleur/priorité dupliquées
 * dans ListMission, EmployeeMissions et MissionTable.
 */

/** Priorité métier → clé de couleur. */
export function getPriorityColor(priority) {
  if (priority === 'Critique') return 'red'
  if (priority === 'Haute') return 'orange'
  if (priority === 'Moyenne') return 'yellow'
  return 'gray'
}

/** Statut mission → clé de couleur. */
export function getStatusColorKey(status) {
  if (status === 'En cours') return 'yellow'
  if (status === 'Terminée') return 'green'
  if (status === 'Bloquée') return 'red'
  return 'blue'
}

/** Ordre de tri des priorités (du plus urgent au moins urgent). */
export const PRIORITY_ORDER = { Critique: 1, Haute: 2, Moyenne: 3, Basse: 4 }
