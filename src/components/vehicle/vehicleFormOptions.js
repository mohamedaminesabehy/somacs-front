export const VEHICLE_TYPES = ["Fourgon", "Camion", "Voiture", "Camionnette", "Utilitaire", "Autre"]
export const STATUS_OPTIONS = ["Disponible", "Affecte", "En maintenance", "Hors service"]
export const CARBURANT_OPTIONS = ["Essence", "Diesel", "Hybride", "Electrique", "GPL", "Autre"]
export const BOITE_OPTIONS = ["Manuelle", "Automatique", "Semi-automatique"]

export const EMPTY_FORM = {
  marque: "", modele: "", type: "", annee: new Date().getFullYear(),
  couleur: "", statut: "Disponible",
  kilometrage: "", carburant: "", boite: "", puissance: "", nombrePlaces: "",
  dateMiseEnCirculation: "", assuranceExpiration: "", visiteTechniqueExpiration: "",
  notes: "",
}

export function parseMatricule(mat) {
  if (!mat) return { left: "", right: "" }
  const m = String(mat).match(/^(\d{1,4})\s*TU\s*(\d{1,3})$/)
  return m ? { left: m[1], right: m[2] } : { left: "", right: "" }
}

export function buildMatricule(left, right) {
  if (!left || !right) return ""
  return left + " TU " + right
}
