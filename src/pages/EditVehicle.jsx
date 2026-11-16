
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ChevronLeft, Truck, AlertCircle } from "lucide-react"
import { apiFetch } from "../api/apiClient"
import PageHeader from "../components/ui/PageHeader"
import VehicleForm from "../components/vehicle/VehicleForm"
import { parseMatricule, buildMatricule } from "../components/vehicle/vehicleFormOptions"

export default function EditVehicle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [initialForm, setInitialForm] = useState(null)
  const [initialMatricule, setInitialMatricule] = useState({ left: "", right: "" })

  useEffect(() => {
    apiFetch("/vehicles/" + id, { auth: true })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setInitialMatricule(parseMatricule(data.matricule))
        setInitialForm({
          marque: data.marque || "", modele: data.modele || "",
          type: data.type || "", annee: data.annee || new Date().getFullYear(),
          couleur: data.couleur || "", statut: data.statut || "Disponible",
          kilometrage: data.kilometrage != null ? data.kilometrage : "",
          carburant: data.carburant || "", boite: data.boite || "",
          puissance: data.puissance != null ? data.puissance : "",
          nombrePlaces: data.nombrePlaces != null ? data.nombrePlaces : "",
          dateMiseEnCirculation: data.dateMiseEnCirculation ? data.dateMiseEnCirculation.split("T")[0] : "",
          assuranceExpiration: data.assuranceExpiration ? data.assuranceExpiration.split("T")[0]
            : data.assuranceDate ? data.assuranceDate.split("T")[0] : "",
          visiteTechniqueExpiration: data.visiteTechniqueExpiration ? data.visiteTechniqueExpiration.split("T")[0]
            : data.visiteTechniqueDate ? data.visiteTechniqueDate.split("T")[0] : "",
          notes: data.notes || "",
          carteGriseUrl: data.carteGriseUrl || null,
          createdAt: data.createdAt, updatedAt: data.updatedAt,
        })
      })
      .catch(() => setError("Vehicule introuvable."))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (data) => {
    const mat = buildMatricule(data.matricule.left, data.matricule.right)
    if (!mat) { setError("Le matricule est requis (ex: 1234 TU 123)"); return }
    if (!data.form.marque.trim()) { setError("La marque est requise"); return }
    if (!data.form.modele.trim()) { setError("Le modele est requis"); return }
    if (!data.form.type) { setError("Le type est requis"); return }
    try {
      setSaving(true)
      setError(null)
      const fd = new FormData()
      fd.append("matricule", mat)
      fd.append("marque", data.form.marque.trim())
      fd.append("modele", data.form.modele.trim())
      fd.append("type", data.form.type)
      fd.append("annee", String(parseInt(data.form.annee, 10)))
      fd.append("statut", data.form.statut || "Disponible")
      const strFields = ["couleur", "carburant", "boite", "notes",
        "dateMiseEnCirculation", "assuranceExpiration", "visiteTechniqueExpiration"]
      strFields.forEach(k => { fd.append(k, data.form[k] || "") })
      const intFields = ["kilometrage", "puissance", "nombrePlaces"]
      intFields.forEach(k => {
        const v = parseInt(data.form[k], 10)
        fd.append(k, Number.isNaN(v) ? "" : String(v))
      })
      if (data.carteGriseFile) fd.append("carteGrise", data.carteGriseFile)
      if (data.removeCarteGrise) fd.append("removeCarteGrise", "true")
      const res = await apiFetch("/vehicles/" + id, { method: "PATCH", auth: true, body: fd })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(Array.isArray(errBody.message) ? errBody.message.join(" | ") : errBody.message || "Erreur lors de la mise a jour")
      }
      navigate("/vehicles/" + id, { state: { toast: { type: "success", message: "Vehicule mis a jour avec succes." } } })
    } catch (err) {
      setError(err.message || "Erreur lors de la mise a jour")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="ui-page flex flex-col gap-5" aria-busy="true" aria-label="Chargement du véhicule">
        <div className="ui-skeleton h-16 w-72 rounded-xl" />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-5">
            <div className="ui-skeleton h-64 rounded-2xl" />
            <div className="ui-skeleton h-48 rounded-2xl" />
          </div>
          <div className="ui-skeleton h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!initialForm) {
    return (
      <div className="ui-page flex items-center justify-center">
        <div className="ui-card flex max-w-sm flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle size={22} aria-hidden="true" />
          </span>
          <p className="font-display text-base font-bold text-ink">Véhicule introuvable</p>
          <p className="text-sm text-ink-muted">{error || "Ce véhicule n'existe plus ou a été supprimé."}</p>
          <button type="button" onClick={() => navigate("/vehicles")} className="ui-btn-primary mt-2">Retour aux véhicules</button>
        </div>
      </div>
    )
  }

  const formatDay = (value) => new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })

  const additionalSidebarContent = (initialForm.createdAt || initialForm.updatedAt) && (
    <div className="ui-card px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">Historique de la fiche</p>
      <dl className="mt-3 flex flex-col gap-3 text-sm">
        {initialForm.createdAt && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">Créée le</dt>
            <dd className="font-semibold text-ink">{formatDay(initialForm.createdAt)}</dd>
          </div>
        )}
        {initialForm.updatedAt && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">Modifiée le</dt>
            <dd className="font-semibold text-ink">{formatDay(initialForm.updatedAt)}</dd>
          </div>
        )}
      </dl>
    </div>
  )

  const plate = buildMatricule(initialMatricule.left, initialMatricule.right)

  return (
    <div className="ui-page flex flex-col gap-5">
      <PageHeader
        eyebrow="Flotte"
        title="Modifier le véhicule"
        description={plate ? `Mise à jour de la fiche ${plate}.` : "Mise à jour de la fiche véhicule."}
        icon={Truck}
        breadcrumbs={[
          { label: "Véhicules", to: "/vehicles" },
          { label: plate || "Véhicule", to: "/vehicles/" + id },
          { label: "Modifier" },
        ]}
        actions={
          <button type="button" onClick={() => navigate("/vehicles/" + id)} className="ui-btn-secondary">
            <ChevronLeft size={16} aria-hidden="true" /> Retour à la fiche
          </button>
        }
      />
      <VehicleForm
        mode="edit"
        initialForm={initialForm}
        initialMatricule={initialMatricule}
        onSubmit={handleSubmit}
        saving={saving}
        error={error}
        setError={setError}
        formId="vehicle-edit-form"
        onCancel={() => navigate("/vehicles/" + id)}
        additionalSidebarContent={additionalSidebarContent}
      />
    </div>
  )
}
