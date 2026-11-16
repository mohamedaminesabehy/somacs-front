import { Wrench, Zap, ShieldCheck, FileSearch, GraduationCap, Truck } from 'lucide-react'

// Les valeurs (`value`) sont celles attendues par le backend : ne pas les renommer.
export const INTERVENTION_TYPES = [
  { value: 'Réparation', label: 'Réparation', hint: 'Panne ou dysfonctionnement', icon: Wrench },
  { value: 'Installation', label: 'Installation', hint: 'Mise en service', icon: Zap },
  { value: 'Garantie', label: 'Sous garantie', hint: 'Prise en charge constructeur', icon: ShieldCheck },
  { value: 'Devis', label: 'Établissement devis', hint: 'Évaluation avant travaux', icon: FileSearch },
  { value: 'Formation', label: 'Formation', hint: 'Accompagnement utilisateurs', icon: GraduationCap },
  { value: 'Livraison', label: 'Livraison', hint: 'Remise de l’équipement', icon: Truck },
]

export function getInterventionType(value) {
  return INTERVENTION_TYPES.find((t) => t.value === value) || null
}
