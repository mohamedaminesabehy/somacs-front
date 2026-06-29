
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ChevronLeft, Save, Loader2, Truck, AlertCircle, X, RefreshCw
} from "lucide-react"
import { apiFetch } from "../api/apiClient"
import VehicleForm, { EMPTY_FORM, buildMatricule } from "../components/vehicle/VehicleForm"

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
        const data = await res.json().catch(() => ({}))
        throw new Error(Array.isArray(data.message) ? data.message.join(" | ") : data.message || "Erreur lors de la creation")
      }
      navigate("/vehicles", { state: { toast: { type: "success", message: "Vehicule cree avec succes." } } })
    } catch (err) {
      setError(err.message || "Erreur lors de la creation du vehicule")
    } finally {
      setLoading(false)
    }
  }

  const headerContent = (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/vehicles")} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Truck size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900">Nouveau vehicule</h1>
            <p className="text-[11px] text-slate-500">Renseignez le matricule</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => {}}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all">
            <RefreshCw size={14} /> Reinitialiser
          </button>
          <button form="vehicle-create-form" type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-blue-200">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {loading ? "Creation..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </header>
  )

  return (
    <div className="min-h-screen bg-[#F6F9FC]">
      {headerContent}
      <VehicleForm
        mode="create"
        initialForm={EMPTY_FORM}
        initialMatricule={{ left: "", right: "" }}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        setError={setError}
        formId="vehicle-create-form"
        onCancel={() => navigate("/vehicles")}
      />
    </div>
  )
}
