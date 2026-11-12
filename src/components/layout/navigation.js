import {
  Building2,
  ClipboardList,
  History,
  LayoutDashboard,
  List,
  PlusCircle,
  Send,
  Settings,
  Truck,
  Users,
  Wrench,
  CheckSquare,
} from 'lucide-react'

export function getRoleFlags(currentUser) {
  const normalizedRole = String(currentUser?.role || '').trim().toLowerCase()
  const isTechnicien = normalizedRole === 'technicien'
  const isResponsable = normalizedRole === 'responsable technicien' || normalizedRole.includes('responsable')
  const isCoordinateur = normalizedRole === 'coordinateur'
  return {
    isTechnicien,
    isResponsable,
    isCoordinateur,
    canAccessAdminMenu: normalizedRole === 'administrateur',
    canAccessOperationsDashboard: isResponsable || isCoordinateur,
  }
}

export function getUserInitials(currentUser) {
  const source = currentUser?.name || currentUser?.username || ''
  if (!source) return 'US'
  return source
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

const operationalSection = {
  title: 'Opérations',
  items: [
    {
      label: 'Missions',
      icon: CheckSquare,
      matchPaths: ['/missions'],
      children: [
        { to: '/missions', end: true, icon: List, label: 'Toutes les missions' },
        { to: '/missions/assign', icon: Send, label: 'Affecter une mission' },
      ],
    },
    {
      label: 'Interventions SAV',
      icon: Wrench,
      matchPaths: ['/interventions'],
      children: [
        { to: '/interventions', end: true, icon: List, label: 'Toutes les interventions' },
        { to: '/interventions/create', icon: PlusCircle, label: 'Nouvelle intervention' },
      ],
    },
  ],
}

const assetsSection = {
  title: 'Référentiels',
  items: [
    { to: '/clients', icon: Building2, label: 'Clients 360' },
    { to: '/machines', icon: Settings, label: 'Parc machines' },
    { to: '/vehicles', icon: Truck, label: 'Véhicules' },
  ],
}

/** Sections de navigation selon le rôle (mêmes droits que la version précédente). */
export function getNavigationSections(currentUser) {
  const { isTechnicien, canAccessAdminMenu, canAccessOperationsDashboard } = getRoleFlags(currentUser)
  const sections = []

  if (isTechnicien) {
    sections.push({
      title: 'Espace technicien',
      items: [
        { to: '/missions/my', icon: ClipboardList, label: 'Mes missions' },
        { to: `/employees/${currentUser?.id || 'me'}/history`, icon: History, label: 'Historique interventions' },
        { to: '/machines', icon: Settings, label: 'Parc machines' },
        { to: '/clients', icon: Building2, label: 'Clients 360' },
      ],
    })
  }

  if (canAccessOperationsDashboard || canAccessAdminMenu) {
    sections.push({
      title: 'Pilotage',
      items: [{ to: '/dashboard', end: true, icon: LayoutDashboard, label: 'Tableau de bord' }],
    })
    sections.push(operationalSection, assetsSection)
  }

  if (canAccessAdminMenu) {
    sections.push({
      title: 'Administration',
      items: [{ to: '/users', icon: Users, label: 'Utilisateurs' }],
    })
  }

  return sections
}

const ROUTE_TITLES = [
  { match: /^\/dashboard/, title: 'Tableau de bord', section: 'Pilotage' },
  { match: /^\/missions\/my/, title: 'Mes missions', section: 'Espace technicien' },
  { match: /^\/missions\/assign/, title: 'Affecter une mission', section: 'Missions' },
  { match: /^\/missions\/[^/]+/, title: 'Détail de la mission', section: 'Missions' },
  { match: /^\/missions/, title: 'Missions', section: 'Opérations' },
  { match: /^\/interventions\/create/, title: 'Nouvelle intervention', section: 'Interventions SAV' },
  { match: /^\/interventions\/[^/]+/, title: "Dossier d'intervention", section: 'Interventions SAV' },
  { match: /^\/interventions/, title: 'Interventions SAV', section: 'Opérations' },
  { match: /^\/employees\/[^/]+\/history/, title: 'Historique des interventions', section: 'Espace technicien' },
  { match: /^\/clients\/[^/]+/, title: 'Fiche client 360', section: 'Clients' },
  { match: /^\/clients/, title: 'Clients 360', section: 'Référentiels' },
  { match: /^\/machines\/(new|create)/, title: 'Nouvelle machine', section: 'Parc machines' },
  { match: /^\/machines\/[^/]+\/edit/, title: 'Modifier la machine', section: 'Parc machines' },
  { match: /^\/machines\/[^/]+/, title: 'Fiche machine', section: 'Parc machines' },
  { match: /^\/machines/, title: 'Parc machines', section: 'Référentiels' },
  { match: /^\/vehicles\/(new|create)/, title: 'Nouveau véhicule', section: 'Véhicules' },
  { match: /^\/vehicles\/[^/]+\/edit/, title: 'Modifier le véhicule', section: 'Véhicules' },
  { match: /^\/vehicles\/[^/]+/, title: 'Fiche véhicule', section: 'Véhicules' },
  { match: /^\/vehicles/, title: 'Véhicules', section: 'Référentiels' },
  { match: /^\/users\/[^/]+/, title: "Historique d'activité", section: 'Utilisateurs' },
  { match: /^\/users/, title: 'Utilisateurs', section: 'Administration' },
]

export function getRouteMeta(pathname) {
  return ROUTE_TITLES.find((entry) => entry.match.test(pathname)) || { title: 'Espace de travail', section: 'SOMACS' }
}
