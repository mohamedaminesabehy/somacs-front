import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ChevronLeft, Edit2, Trash2, Truck, Wrench, AlertCircle,
  CheckCircle2, XCircle, Gauge, FileText, Eye, CalendarDays, History,
} from "lucide-react"
import { apiFetch } from "../api/apiClient"

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  "Disponible":    { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  "Affecte":       { badge: "bg-blue-50 text-blue-700 border-blue-200",          icon: Truck },
  "Affecté":       { badge: "bg-blue-50 text-blue-700 border-blue-200",          icon: Truck },
  "En maintenance":{ badge: "bg-amber-50 text-amber-700 border-amber-200",       icon: Wrench },
  "Hors service":  { badge: "bg-red-50 text-red-700 border-red-200",             icon: XCircle },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">{status}</span>
  const Icon = cfg.icon
  return (
    <span className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border " + cfg.badge}>
      <Icon size={13} />{status}
    </span>
  )
}

function DetailField({ label, value, mono }) {
  const display = value === null || value === undefined || value === "" ? "—" : value
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={"mt-1.5 text-sm font-semibold text-slate-800 break-words " + (mono ? "font-mono break-all" : "")}>{display}</p>
    </div>
  )
}

function formatDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString("fr-FR")
}

function isExpired(value) {
  if (!value) return false
  return new Date(value) < new Date()
}

function formatKilometrage(value) {
  if (value === null || value === undefined || value === "") return "—"
  const numeric = Number(value)
  return Number.isNaN(numeric) ? "—" : `${numeric.toLocaleString("fr-FR")} km`
}

function formatHistoryTechnicians(history) {
  return String(history?.techniciansDisplay || history?.mission?.employeeDisplay || history?.mission?.employee || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .join(", ") || "—"
}

export default function VehicleDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    apiFetch("/vehicles/" + id, { auth: true })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setVehicle)
      .catch(() => setError("Vehicule introuvable."))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!vehicle || deleting) return
    if (!window.confirm("Supprimer le vehicule \"" + vehicle.matricule + "\" ?")) return
    setDeleting(true)
    try {
      const res = await apiFetch("/vehicles/" + vehicle.id, { method: "DELETE", auth: true })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Suppression impossible.")
      }
      navigate("/vehicles", { replace: true, state: { toast: { type: "success", message: "Vehicule supprime avec succes." } } })
    } catch (err) {
      setDeleting(false)
      setError(err.message || "Suppression impossible pour le moment.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-slate-600 font-semibold">{error || "Vehicule introuvable."}</p>
          <button onClick={() => navigate("/vehicles")} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Retour</button>
        </div>
      </div>
    )
  }

  const assuranceDate = vehicle.assuranceExpiration || vehicle.assuranceDate
  const visiteDate = vehicle.visiteTechniqueExpiration || vehicle.visiteTechniqueDate
  const assuranceExpired = isExpired(assuranceDate)
  const visiteExpired = isExpired(visiteDate)
  const createdAtLabel = vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString("fr-FR") : "—"
  const updatedAtLabel = vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleDateString("fr-FR") : "—"
  const isPdfCG = vehicle.carteGriseUrl && (vehicle.carteGriseResourceType === "raw" || vehicle.carteGriseUrl.includes(".pdf"))
  const usageHistory = Array.isArray(vehicle.usageHistory) ? vehicle.usageHistory : []

  return (
    <div className="min-h-screen bg-[#F6F9FC] overflow-x-hidden">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ── Hero section (style MachineDetails) ── */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_48%),radial-gradient(circle_at_bottom_left,_rgba(15,23,42,0.06),_transparent_42%)]" />
          <div className="relative p-5 sm:p-7 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Icone vehicule */}
              <div className="lg:col-span-4 min-w-0">
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <div className="relative aspect-[16/11] min-h-[200px] sm:min-h-[220px] bg-gradient-to-b from-slate-100 to-slate-200/70 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-[#0052CC] rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-blue-200 mb-4">
                        <Truck size={40} className="text-white" />
                      </div>
                      <p className="font-mono text-xl font-black text-slate-900 tracking-widest px-4">{vehicle.matricule}</p>
                      <p className="text-sm text-slate-500 mt-1">{vehicle.marque} {vehicle.modele}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Infos principales */}
              <div className="lg:col-span-8 min-w-0 flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <button onClick={() => navigate("/vehicles")} className="mt-0.5 p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors">
                      <ChevronLeft size={18} />
                    </button>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">Fiche vehicule</p>
                      <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-mono">{vehicle.matricule}</h1>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={vehicle.statut} />
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">{vehicle.type}</span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">{vehicle.annee}</span>
                        {vehicle.carburant && <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">{vehicle.carburant}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                    <button onClick={handleDelete} disabled={deleting}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-60 transition-colors">
                      <Trash2 size={14} /> {deleting ? "Suppression..." : "Supprimer"}
                    </button>
                    <button onClick={() => navigate("/vehicles/" + id + "/edit")}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-[#0052CC] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-[#0042a3] transition-all">
                      <Edit2 size={14} /> Modifier
                    </button>
                  </div>
                </div>

                {/* Infos rapides (style MachineDetails) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Marque / Modele</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                      <Truck size={14} className="text-slate-400 shrink-0" />
                      <span className="min-w-0 break-words">{vehicle.marque} {vehicle.modele}</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kilometrage</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                      <Gauge size={14} className="text-slate-400 shrink-0" />
                      <span>{vehicle.kilometrage != null ? vehicle.kilometrage.toLocaleString("fr-FR") + " km" : "Non renseigne"}</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mise en circulation</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                      <CalendarDays size={14} className="text-slate-400 shrink-0" />
                      <span>{formatDate(vehicle.dateMiseEnCirculation) || "Non renseignee"}</span>
                    </p>
                  </div>
                </div>

                {/* Compteurs (style MachineDetails) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center">
                    <p className="text-lg font-black text-slate-900">{vehicle.annee}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Annee</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center">
                    <p className="text-lg font-black text-slate-900">{vehicle.puissance ? vehicle.puissance + " CV" : "—"}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Puissance</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center">
                    <p className="text-lg font-black text-slate-900">{createdAtLabel}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cree le</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center">
                    <p className="text-lg font-black text-slate-900">{updatedAtLabel}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mis a jour</p>
                  </div>
                </div>

                {/* Alertes expiration */}
                {(assuranceExpired || visiteExpired) && (
                  <div className="flex flex-wrap gap-2">
                    {assuranceExpired && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                        <AlertCircle size={13} /> Assurance expiree
                      </div>
                    )}
                    {visiteExpired && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
                        <AlertCircle size={13} /> Visite technique expiree
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Toutes les informations en une seule présentation ── */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

          {/* Colonne gauche : champs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailField label="Boite de vitesses" value={vehicle.boite} />
            <DetailField label="Nombre de places" value={vehicle.nombrePlaces} />
            <DetailField label="Couleur" value={vehicle.couleur} />

            <div className={"rounded-xl border px-4 py-3.5 min-w-0 " + (assuranceExpired ? "border-red-200 bg-red-50" : "border-slate-200 bg-white")}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assurance — expiration</p>
              <p className={"mt-1.5 text-sm font-semibold break-words " + (assuranceExpired ? "text-red-700" : "text-slate-800")}>
                {formatDate(assuranceDate) || "—"}
                {assuranceExpired && <span className="ml-2 text-[10px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded">EXPIREE</span>}
              </p>
            </div>

            <div className={"rounded-xl border px-4 py-3.5 min-w-0 " + (visiteExpired ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Visite technique — expiration</p>
              <p className={"mt-1.5 text-sm font-semibold break-words " + (visiteExpired ? "text-amber-700" : "text-slate-800")}>
                {formatDate(visiteDate) || "—"}
                {visiteExpired && <span className="ml-2 text-[10px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">EXPIREE</span>}
              </p>
            </div>

            <DetailField label="Disponibilite" value={vehicle.disponibilite ? "Disponible" : "Non disponible"} />

            {vehicle.notes && (
              <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Remarques</p>
                <p className="mt-1.5 text-sm font-medium text-slate-700 whitespace-pre-wrap">{vehicle.notes}</p>
              </div>
            )}
          </div>

          {/* Colonne droite : carte grise */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Carte grise</p>
            {vehicle.carteGriseUrl ? (
              isPdfCG ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-700">Carte grise (PDF)</p>
                    <a href={vehicle.carteGriseUrl} target="_blank" rel="noreferrer"
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1">
                      <Eye size={11} /> Ouvrir
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50">
                  <img src={vehicle.carteGriseUrl} alt="Carte grise" className="w-full object-contain p-2 max-h-48" />
                  <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Disponible
                    </span>
                    <a href={vehicle.carteGriseUrl} target="_blank" rel="noreferrer"
                      className="text-[10px] font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1">
                      <Eye size={10} /> Voir
                    </a>
                  </div>
                </div>
              )
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
                <FileText size={24} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">Aucune carte grise</p>
                <button onClick={() => navigate("/vehicles/" + id + "/edit")}
                  className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-800">
                  Ajouter via Modifier
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">Historique</p>
              <h2 className="mt-1 text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <History size={18} className="text-slate-400" />
                Historique d’utilisation
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              {usageHistory.length} ligne{usageHistory.length > 1 ? "s" : ""}
            </span>
          </div>

          {usageHistory.length === 0 ? (
            <div className="p-10 sm:p-14 text-center">
              <History size={40} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-semibold">Aucun historique d’utilisation pour ce véhicule.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Code / ID mission</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Date mission</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Client / lieu</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Technicien(s)</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Kilométrage départ</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Kilométrage retour</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Distance parcourue</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Statut mission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {usageHistory.map((entry, idx) => (
                    <tr key={entry.id || `${entry.missionId}-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                      <td className="px-6 py-4">
                        <p className="font-mono text-sm font-black text-slate-900">{entry.missionCode || `MIS-${String(entry.missionId || entry.mission?.id || "").padStart(4, "0")}`}</p>
                        <p className="text-[11px] text-slate-400">ID #{entry.missionId || entry.mission?.id || "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {entry.missionDate ? new Date(entry.missionDate).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {entry.clientOrLocation || entry.mission?.site || entry.mission?.address || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {formatHistoryTechnicians(entry)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {formatKilometrage(entry.kilometrageDepart)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {formatKilometrage(entry.kilometrageRetour)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {entry.distanceParcourue != null ? `${Number(entry.distanceParcourue).toLocaleString("fr-FR")} km` : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">
                          {entry.statusMission || entry.mission?.status || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
