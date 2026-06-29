
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ChevronLeft, Save, Loader2, Truck, AlertCircle, X
} from "lucide-react"
import { apiFetch } from "../api/apiClient"
import VehicleForm, {
  parseMatricule,
  buildMatricule,
  EMPTY_FORM
} from "../components/vehicle/VehicleForm"

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
        const data = await res.json().catch(() => ({}))
        throw new Error(Array.isArray(data.message) ? data.message.join(" | ") : data.message || "Erreur lors de la mise a jour")
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!initialForm) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-slate-600 font-semibold">{error || "Vehicule introuvable."}</p>
          <button onClick={() => navigate("/vehicles")} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Retour</button>
        </div>
      </div>
    )
  }

  const headerContent = (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/vehicles/" + id)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Truck size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900">Modifier le vehicule</h1>
            <p className="text-[11px] text-slate-500">Renseignez le matricule</p>
          </div>
        </div>
        <button form="vehicle-edit-form" type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-blue-200">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </header>
  )

  const additionalSidebarContent = (initialForm.createdAt || initialForm.updatedAt) && (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-3">Informations</p>
      <div className="space-y-2.5 text-sm">
        {initialForm.createdAt && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Cree le</p>
            <p className="font-semibold text-slate-700">{new Date(initialForm.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
        )}
        {initialForm.updatedAt && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Modifie le</p>
            <p className="font-semibold text-slate-700">{new Date(initialForm.updatedAt).toLocaleDateString("fr-FR")}</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F6F9FC]">
      {headerContent}
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
        vehicleId={id}
        additionalSidebarContent={additionalSidebarContent}
      />
    </div>
  )
}
