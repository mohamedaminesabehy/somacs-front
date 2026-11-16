import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Edit2, Trash2, Truck, AlertCircle, AlertTriangle, CheckCircle2, Gauge,
  FileText, Eye, CalendarDays, History, ShieldCheck, Loader2, MapPin, Users,
} from "lucide-react"
import { apiFetch } from "../api/apiClient"
import PageHeader from "../components/ui/PageHeader"
import StatusBadge from "../components/ui/StatusBadge"
import Modal from "../components/ui/Modal"
import { Card, CardHeader, CardBody } from "../components/ui/Card"
import { DetailList } from "../components/ui/DataKit"

const STATUS_TONES = {
  "Disponible": "teal",
  "Affecte": "brand",
  "Affecté": "brand",
  "En maintenance": "amber",
  "Hors service": "red",
}

const STATUS_LABELS = { "Affecte": "Affecté" }

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

function daysUntil(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
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

function missionCode(entry) {
  return entry.missionCode || `MIS-${String(entry.missionId || entry.mission?.id || "").padStart(4, "0")}`
}

function PlateVisual({ matricule }) {
  const m = String(matricule || "").match(/^(\d{1,4})\s*TU\s*(\d{1,3})$/)
  return (
    <div className="flex w-full max-w-xs items-center justify-between rounded-xl border-[3px] border-white/85 bg-ink px-4 py-3 font-mono text-2xl font-bold tracking-[0.15em] text-white shadow-raised">
      {m ? (
        <>
          <span>{m[1]}</span>
          <span className="font-sans text-base tracking-normal" lang="ar">تونس</span>
          <span>{m[2]}</span>
        </>
      ) : (
        <span className="w-full text-center">{matricule || "—"}</span>
      )}
    </div>
  )
}

function DeadlineRow({ label, date }) {
  const days = daysUntil(date)
  let tone = "slate"
  let hint = "Non renseignée"
  if (days !== null) {
    if (days < 0) { tone = "red"; hint = `Expirée depuis ${Math.abs(days)} j` }
    else if (days <= 30) { tone = "amber"; hint = `Expire dans ${days} j` }
    else { tone = "teal"; hint = "À jour" }
  }
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs text-ink-muted">{formatDate(date) || "—"}</p>
      </div>
      <StatusBadge tone={tone}>{hint}</StatusBadge>
    </li>
  )
}

export default function VehicleDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    apiFetch("/vehicles/" + id, { auth: true })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setVehicle)
      .catch(() => setError("Véhicule introuvable."))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!vehicle || deleting) return
    setDeleting(true)
    try {
      const res = await apiFetch("/vehicles/" + vehicle.id, { method: "DELETE", auth: true })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.message || "Suppression impossible.")
      }
      navigate("/vehicles", { replace: true, state: { toast: { type: "success", message: "Véhicule supprimé avec succès." } } })
    } catch (err) {
      setDeleting(false)
      setConfirmOpen(false)
      setError(err.message || "Suppression impossible pour le moment.")
    }
  }

  if (loading) {
    return (
      <div className="ui-page flex flex-col gap-5" aria-busy="true" aria-label="Chargement du véhicule">
        <div className="ui-skeleton h-16 w-72 rounded-xl" />
        <div className="ui-skeleton h-56 rounded-2xl" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="ui-skeleton h-56 rounded-2xl lg:col-span-2" />
          <div className="ui-skeleton h-56 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!vehicle) {
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

  const assuranceDate = vehicle.assuranceExpiration || vehicle.assuranceDate
  const visiteDate = vehicle.visiteTechniqueExpiration || vehicle.visiteTechniqueDate
  const assuranceExpired = isExpired(assuranceDate)
  const visiteExpired = isExpired(visiteDate)
  const isPdfCG = vehicle.carteGriseUrl && (vehicle.carteGriseResourceType === "raw" || vehicle.carteGriseUrl.includes(".pdf"))
  const usageHistory = Array.isArray(vehicle.usageHistory) ? vehicle.usageHistory : []
  const totalDistance = usageHistory.reduce((sum, e) => sum + (Number(e.distanceParcourue) || 0), 0)
  const statusLabel = STATUS_LABELS[vehicle.statut] || vehicle.statut
  const title = [vehicle.marque, vehicle.modele].filter(Boolean).join(" ") || vehicle.matricule

  const quickFacts = [
    { label: "Kilométrage", value: vehicle.kilometrage != null ? formatKilometrage(vehicle.kilometrage) : null, icon: Gauge },
    { label: "Mise en circulation", value: formatDate(vehicle.dateMiseEnCirculation), icon: CalendarDays },
    { label: "Missions réalisées", value: String(usageHistory.length), icon: History },
    { label: "Distance cumulée", value: totalDistance ? formatKilometrage(totalDistance) : null, icon: MapPin },
  ]

  return (
    <div className="ui-page flex flex-col gap-5">
      <PageHeader
        eyebrow="Fiche véhicule"
        title={title}
        description={[vehicle.type, vehicle.annee, vehicle.carburant].filter(Boolean).join(" · ")}
        icon={Truck}
        breadcrumbs={[{ label: "Véhicules", to: "/vehicles" }, { label: vehicle.matricule }]}
        actions={
          <>
            <button type="button" onClick={() => setConfirmOpen(true)} className="ui-btn-secondary text-red-600 hover:bg-red-50">
              <Trash2 size={16} aria-hidden="true" /> Supprimer
            </button>
            <button type="button" onClick={() => navigate("/vehicles/" + id + "/edit")} className="ui-btn-primary">
              <Edit2 size={16} aria-hidden="true" /> Modifier
            </button>
          </>
        }
      />

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
          <p className="flex-1">{error}</p>
        </div>
      )}

      {(assuranceExpired || visiteExpired) && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
          <p>
            <span className="font-semibold">Échéance dépassée : </span>
            {[assuranceExpired && "assurance", visiteExpired && "visite technique"].filter(Boolean).join(" et ")}.
            {" "}Ce véhicule ne devrait pas être affecté à une mission avant régularisation.
          </p>
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex flex-col items-start gap-3 lg:w-80 lg:shrink-0">
            <PlateVisual matricule={vehicle.matricule} />
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={STATUS_TONES[vehicle.statut] || "slate"}>{statusLabel}</StatusBadge>
              {vehicle.type && <StatusBadge tone="slate" dot={false}>{vehicle.type}</StatusBadge>}
            </div>
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
            {quickFacts.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex min-w-0 flex-col gap-1 bg-white px-4 py-3.5">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                  <Icon size={13} aria-hidden="true" /> {label}
                </dt>
                <dd className="truncate font-display text-lg font-bold text-ink">{value || <span className="text-ink-faint">—</span>}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Caractéristiques" subtitle="Données d'identification et techniques" icon={Gauge} />
          <CardBody>
            <DetailList
              columns={3}
              items={[
                { label: "Matricule", value: <span className="font-mono">{vehicle.matricule}</span> },
                { label: "Marque", value: vehicle.marque },
                { label: "Modèle", value: vehicle.modele },
                { label: "Année", value: vehicle.annee },
                { label: "Couleur", value: vehicle.couleur },
                { label: "Carburant", value: vehicle.carburant },
                { label: "Boîte de vitesses", value: vehicle.boite },
                { label: "Puissance fiscale", value: vehicle.puissance ? vehicle.puissance + " CV" : null },
                { label: "Nombre de places", value: vehicle.nombrePlaces },
                vehicle.notes && { label: "Remarques", value: <span className="whitespace-pre-wrap font-normal text-ink-soft">{vehicle.notes}</span>, full: true },
              ]}
            />
          </CardBody>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Échéances" subtitle="Conformité réglementaire" icon={ShieldCheck} />
            <CardBody className="py-1">
              <ul className="divide-y divide-line">
                <DeadlineRow label="Assurance" date={assuranceDate} />
                <DeadlineRow label="Visite technique" date={visiteDate} />
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Carte grise" icon={FileText} />
            <CardBody>
              {vehicle.carteGriseUrl ? (
                isPdfCG ? (
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
                      <FileText size={20} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">Carte grise (PDF)</p>
                      <p className="text-xs text-ink-muted">Document enregistré</p>
                    </div>
                    <a href={vehicle.carteGriseUrl} target="_blank" rel="noreferrer" className="ui-btn-secondary ui-btn-sm">
                      <Eye size={14} aria-hidden="true" /> Ouvrir
                    </a>
                  </div>
                ) : (
                  <a href={vehicle.carteGriseUrl} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl border border-line bg-canvas">
                    <img src={vehicle.carteGriseUrl} alt={"Carte grise du véhicule " + vehicle.matricule} className="max-h-48 w-full object-contain p-2" />
                    <span className="flex items-center justify-between border-t border-line bg-white px-3 py-2 text-xs font-semibold">
                      <span className="inline-flex items-center gap-1.5 text-teal-700"><CheckCircle2 size={13} aria-hidden="true" /> Disponible</span>
                      <span className="inline-flex items-center gap-1 text-brand-700 group-hover:underline"><Eye size={13} aria-hidden="true" /> Agrandir</span>
                    </span>
                  </a>
                )
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-6 text-center">
                  <FileText size={22} className="text-ink-faint" aria-hidden="true" />
                  <p className="text-sm text-ink-muted">Aucune carte grise enregistrée</p>
                  <button type="button" onClick={() => navigate("/vehicles/" + id + "/edit")} className="ui-btn-ghost ui-btn-sm">
                    Ajouter un document
                  </button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Historique d'utilisation"
          subtitle="Missions effectuées avec ce véhicule"
          icon={History}
          actions={<StatusBadge tone="slate" dot={false}>{usageHistory.length} mission{usageHistory.length > 1 ? "s" : ""}</StatusBadge>}
        />
        {usageHistory.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-ink-faint">
              <History size={22} aria-hidden="true" />
            </span>
            <p className="font-semibold text-ink">Aucune mission pour le moment</p>
            <p className="max-w-sm text-sm text-ink-muted">Les trajets apparaîtront ici dès que ce véhicule sera affecté à une mission.</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-line md:hidden">
              {usageHistory.map((entry, idx) => (
                <li key={entry.id || `${entry.missionId}-${idx}`} className="flex flex-col gap-2 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-ink">{missionCode(entry)}</p>
                      <p className="text-xs text-ink-muted">{entry.missionDate ? formatDate(entry.missionDate) : "—"}</p>
                    </div>
                    <StatusBadge status={entry.statusMission || entry.mission?.status}>{entry.statusMission || entry.mission?.status || "—"}</StatusBadge>
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-ink-soft"><MapPin size={13} className="shrink-0 text-ink-faint" aria-hidden="true" />{entry.clientOrLocation || entry.mission?.site || entry.mission?.address || "—"}</p>
                  <p className="flex items-center gap-1.5 text-sm text-ink-soft"><Users size={13} className="shrink-0 text-ink-faint" aria-hidden="true" />{formatHistoryTechnicians(entry)}</p>
                  <p className="text-xs text-ink-muted">
                    {formatKilometrage(entry.kilometrageDepart)} → {formatKilometrage(entry.kilometrageRetour)}
                    {entry.distanceParcourue != null && <span className="font-semibold text-ink"> · {Number(entry.distanceParcourue).toLocaleString("fr-FR")} km</span>}
                  </p>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="ui-table min-w-[960px]">
                <thead>
                  <tr>
                    <th scope="col">Mission</th>
                    <th scope="col">Date</th>
                    <th scope="col">Client / lieu</th>
                    <th scope="col">Technicien(s)</th>
                    <th scope="col" className="text-right">Départ</th>
                    <th scope="col" className="text-right">Retour</th>
                    <th scope="col" className="text-right">Distance</th>
                    <th scope="col">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {usageHistory.map((entry, idx) => (
                    <tr key={entry.id || `${entry.missionId}-${idx}`}>
                      <td>
                        <p className="font-mono text-sm font-bold text-ink">{missionCode(entry)}</p>
                        <p className="text-xs text-ink-faint">ID #{entry.missionId || entry.mission?.id || "—"}</p>
                      </td>
                      <td className="whitespace-nowrap">{entry.missionDate ? formatDate(entry.missionDate) : "—"}</td>
                      <td>{entry.clientOrLocation || entry.mission?.site || entry.mission?.address || "—"}</td>
                      <td>{formatHistoryTechnicians(entry)}</td>
                      <td className="whitespace-nowrap text-right tabular-nums">{formatKilometrage(entry.kilometrageDepart)}</td>
                      <td className="whitespace-nowrap text-right tabular-nums">{formatKilometrage(entry.kilometrageRetour)}</td>
                      <td className="whitespace-nowrap text-right font-semibold tabular-nums text-ink">
                        {entry.distanceParcourue != null ? `${Number(entry.distanceParcourue).toLocaleString("fr-FR")} km` : "—"}
                      </td>
                      <td><StatusBadge status={entry.statusMission || entry.mission?.status}>{entry.statusMission || entry.mission?.status || "—"}</StatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => { if (!deleting) setConfirmOpen(false) }}
        title="Supprimer ce véhicule ?"
        description={`Le véhicule ${vehicle.matricule} sera définitivement retiré de la flotte.`}
        icon={Trash2}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setConfirmOpen(false)} disabled={deleting} className="ui-btn-secondary">Annuler</button>
            <button type="button" onClick={handleDelete} disabled={deleting} className="ui-btn-danger">
              {deleting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
              {deleting ? "Suppression…" : "Supprimer"}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-muted">
          L&apos;historique d&apos;utilisation associé ne sera plus consultable depuis cette fiche. Cette action est irréversible.
        </p>
      </Modal>
    </div>
  )
}
