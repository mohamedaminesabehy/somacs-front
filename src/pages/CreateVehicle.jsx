
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, Truck } from "lucide-react"
import { apiFetch } from "../api/apiClient"
import PageHeader from "../components/ui/PageHeader"
import VehicleForm from "../components/vehicle/VehicleForm"
import { EMPTY_FORM, buildMatricule } from "../components/vehicle/vehicleFormOptions"

export default function CreateVehicle() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const validate = (data) => {
    const mat = buildMatricule(data.matricule.left, data.matricule.right)
    if (!mat) return "Le matricule est requis (ex: 1234 TU 123)"
    if (!data.form.marque.trim()) return "La marque est requise"
    if (!data.form.modele.trim()) return "Le modele est requis"
    if (!data.form.type) return "Le type est requis"
    const annee = parseInt(data.form.annee, 10)
    if (!annee || annee < 1900 || annee > new Date().getFullYear() + 1) return "Annee invalide"
    return null
  }

  const handleSubmit = async (data) => {
    const validationError = validate(data)
    if (validationError) { 
      setError(validationError)
      return 
    }
    try {
      setLoading(true)
      setError(null)
      const fd = new FormData()
      fd.append("matricule", buildMatricule(data.matricule.left, data.matricule.right))
      fd.append("marque", data.form.marque.trim())
      fd.append("modele", data.form.modele.trim())
      fd.append("type", data.form.type)
      fd.append("annee", String(parseInt(data.form.annee, 10)))
      fd.append("statut", data.form.statut || "Disponible")
      const strFields = ["couleur", "carburant", "boite", "notes",
        "dateMiseEnCirculation", "assuranceExpiration", "visiteTechniqueExpiration"]
      strFields.forEach(k => { if (data.form[k]) fd.append(k, data.form[k]) })
      const intFields = ["kilometrage", "puissance", "nombrePlaces"]
      intFields.forEach(k => {
        const v = parseInt(data.form[k], 10)
        if (!Number.isNaN(v) && v >= 0) fd.append(k, String(v))
      })
      if (data.carteGriseFile) fd.append("carteGrise", data.carteGriseFile)
      const res = await apiFetch("/vehicles", { method: "POST", auth: true, body: fd })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(Array.isArray(errBody.message) ? errBody.message.join(" | ") : errBody.message || "Erreur lors de la creation")
      }
      navigate("/vehicles", { state: { toast: { type: "success", message: "Vehicule cree avec succes." } } })
    } catch (err) {
      setError(err.message || "Erreur lors de la creation du vehicule")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ui-page flex flex-col gap-5">
      <PageHeader
        eyebrow="Flotte"
        title="Nouveau véhicule"
        description="Enregistrez un véhicule de la flotte SAV avec son immatriculation et ses échéances."
        icon={Truck}
        breadcrumbs={[{ label: "Véhicules", to: "/vehicles" }, { label: "Nouveau" }]}
        actions={
          <button type="button" onClick={() => navigate("/vehicles")} className="ui-btn-secondary">
            <ChevronLeft size={16} aria-hidden="true" /> Retour à la liste
          </button>
        }
      />
      <VehicleForm
        mode="create"
        initialForm={EMPTY_FORM}
        initialMatricule={{ left: "", right: "" }}
        onSubmit={handleSubmit}
        onReset={() => setError(null)}
        loading={loading}
        error={error}
        setError={setError}
        formId="vehicle-create-form"
        onCancel={() => navigate("/vehicles")}
      />
    </div>
  )
}
