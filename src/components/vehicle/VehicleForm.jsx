import { useState, useRef, useEffect, useId } from "react"
import {
  Upload, FileText, Gauge, ShieldCheck, CheckCircle2, Circle,
  Eye, Truck, AlertCircle, X, Loader2, Save, NotebookPen, RotateCcw,
} from "lucide-react"
import { FormSection } from "../ui/DataKit"
import {
  VEHICLE_TYPES, STATUS_OPTIONS, CARBURANT_OPTIONS, BOITE_OPTIONS, EMPTY_FORM, buildMatricule,
} from "./vehicleFormOptions"


const STATUS_LABELS = {
  "Disponible": "Disponible",
  "Affecte": "Affecté",
  "En maintenance": "En maintenance",
  "Hors service": "Hors service",
}


export function MatriculeInput({ left, right, onChange, idPrefix = "matricule" }) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border-2 border-ink bg-ink shadow-sm focus-within:ring-4 focus-within:ring-brand-100">
      <label htmlFor={idPrefix + "-left"} className="sr-only">Numéro de série (4 chiffres)</label>
      <input
        id={idPrefix + "-left"} type="text" inputMode="numeric" value={left} maxLength={4}
        onChange={e => onChange({ left: e.target.value.replace(/\D/g, "").slice(0, 4), right })}
        placeholder="1234"
        className="w-full min-w-0 bg-transparent px-3 py-3 text-center font-mono text-xl font-bold tracking-[0.2em] text-white placeholder:text-white/30 outline-none"
      />
      <span className="flex shrink-0 flex-col items-center justify-center border-x border-white/15 px-3 text-white select-none" aria-hidden="true">
        <span className="text-base font-bold leading-none" lang="ar">تونس</span>
        <span className="mt-1 text-[10px] font-semibold tracking-[0.2em] text-white/60">TU</span>
      </span>
      <label htmlFor={idPrefix + "-right"} className="sr-only">Numéro d&apos;ordre (3 chiffres)</label>
      <input
        id={idPrefix + "-right"} type="text" inputMode="numeric" value={right} maxLength={3}
        onChange={e => onChange({ left, right: e.target.value.replace(/\D/g, "").slice(0, 3) })}
        placeholder="123"
        className="w-full min-w-0 bg-transparent px-3 py-3 text-center font-mono text-xl font-bold tracking-[0.2em] text-white placeholder:text-white/30 outline-none"
      />
    </div>
  )
}

export function Field({ label, name, value, onChange, placeholder, type, required, suffix, min, max }) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col">
      <label htmlFor={id} className="ui-label">
        {label}{required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <input
          id={id} type={type || "text"} name={name}
          value={value != null ? value : ""}
          onChange={onChange} placeholder={placeholder}
          required={required} min={min} max={max}
          className={"ui-input " + (suffix ? "pr-12" : "")}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-ink-faint">{suffix}</span>
        )}
      </div>
    </div>
  )
}

export function SelectField({ label, name, value, onChange, options, required, labels }) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col">
      <label htmlFor={id} className="ui-label">
        {label}{required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      <select id={id} name={name} value={value != null ? value : ""} onChange={onChange} required={required} className="ui-select">
        <option value="">Sélectionner…</option>
        {options.map(o => <option key={o} value={o}>{labels?.[o] || o}</option>)}
      </select>
    </div>
  )
}

export function Section({ icon, title, description, children }) {
  return (
    <FormSection icon={icon} title={title} description={description}>
      {children}
    </FormSection>
  )
}

export function CarteGrisePreview({ file, existingUrl, onRemove, onReplace }) {
  const [preview, setPreview] = useState(null)
  const isPdfFile = file && file.type === "application/pdf"
  const isPdfUrl = existingUrl && existingUrl.includes(".pdf")
  useEffect(() => {
    if (!file || isPdfFile) return
    const url = URL.createObjectURL(file)
    // The object URL is an external resource that must be created and revoked in the same effect;
    // deriving it during render (useMemo) would leak or revoke it under StrictMode remounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, isPdfFile])

  if (!file && !existingUrl) return null

  const showPdfTile = file ? isPdfFile : isPdfUrl

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      {showPdfTile ? (
        <div className="flex items-center gap-3 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
            <FileText size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{file ? file.name : "Carte grise (PDF)"}</p>
            <p className="text-xs text-ink-muted">{file ? (file.size / 1024).toFixed(0) + " Ko · PDF" : "Fichier existant"}</p>
          </div>
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center bg-canvas">
          {(file ? preview : existingUrl) && (
            <img src={file ? preview : existingUrl} alt="Aperçu de la carte grise" className="h-full w-full object-contain p-2" />
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700">
          <CheckCircle2 size={13} aria-hidden="true" /> {file ? "Nouveau fichier" : "Fichier existant"}
        </span>
        <div className="flex items-center gap-1">
          {existingUrl && !file && (
            <a href={existingUrl} target="_blank" rel="noreferrer" className="ui-btn-ghost ui-btn-sm">
              <Eye size={13} aria-hidden="true" /> Voir
            </a>
          )}
          {onReplace && (
            <button type="button" onClick={onReplace} className="ui-btn-ghost ui-btn-sm">Remplacer</button>
          )}
          {onRemove && (
            <button type="button" onClick={onRemove} className="ui-btn-ghost ui-btn-sm text-red-600 hover:bg-red-50">Retirer</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VehicleForm({
  mode = "create",
  initialForm = null,
  initialMatricule = { left: "", right: "" },
  onSubmit,
  onReset,
  onCancel,
  loading = false,
  saving = false,
  error,
  setError,
  formId,
  additionalSidebarContent,
}) {
  const fileInputRef = useRef(null)
  const [matricule, setMatricule] = useState(initialMatricule)
  const [form, setForm] = useState(initialForm || EMPTY_FORM)
  const [carteGriseFile, setCarteGriseFile] = useState(null)
  const [removeCarteGrise, setRemoveCarteGrise] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleReset = () => {
    if (onReset) onReset()
    setForm(initialForm || EMPTY_FORM)
    setMatricule(initialMatricule)
    setCarteGriseFile(null)
    setRemoveCarteGrise(false)
    if (setError) setError(null)
  }

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowed.includes(file.type)) {
      if (setError) setError("Format invalide. Acceptés : JPG, PNG, WEBP, PDF")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      if (setError) setError("Fichier trop volumineux (max 10 Mo)")
      return
    }
    setCarteGriseFile(file)
    setRemoveCarteGrise(false)
    if (setError) setError(null)
    e.target.value = ""
  }

  const handleRemoveCarteGrise = () => {
    setCarteGriseFile(null)
    setRemoveCarteGrise(true)
    setForm(f => ({ ...f, carteGriseUrl: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (onSubmit) {
      await onSubmit({ form, matricule, carteGriseFile, removeCarteGrise })
    }
  }

  const openFilePicker = () => { if (fileInputRef.current) fileInputRef.current.click() }

  const mat = buildMatricule(matricule.left, matricule.right)
  const showCarteGrise = mode === "create"
    ? carteGriseFile
    : (carteGriseFile || (form.carteGriseUrl && !removeCarteGrise))
  const requiredFields = [
    { label: "Matricule", ok: !!mat },
    { label: "Marque", ok: !!String(form.marque || "").trim() },
    { label: "Modèle", ok: !!String(form.modele || "").trim() },
    { label: "Type", ok: !!form.type },
    { label: "Année", ok: !!form.annee },
  ]
  const completed = requiredFields.filter(f => f.ok).length
  const progress = Math.round((completed / requiredFields.length) * 100)
  const busy = loading || saving

  let submitButtonLabel = mode === "edit" ? "Enregistrer les modifications" : "Créer le véhicule"
  if (loading) submitButtonLabel = "Création…"
  else if (saving) submitButtonLabel = "Enregistrement…"

  const vehicleTitle = [form.marque, form.modele].filter(Boolean).join(" ") || "Nouveau véhicule"

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Impossible d&apos;enregistrer</p>
            <p className="mt-0.5 text-red-700">{error}</p>
          </div>
          {setError && (
            <button type="button" onClick={() => setError(null)} className="ui-icon-btn h-8 w-8 text-red-500 hover:bg-red-100" aria-label="Fermer le message d'erreur">
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Section icon={Truck} title="Identité du véhicule" description="Immatriculation et informations principales.">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col">
                <span className="ui-label">Matricule tunisien<span className="ml-0.5 text-red-500" aria-hidden="true">*</span></span>
                <div className="max-w-md">
                  <MatriculeInput left={matricule.left} right={matricule.right} onChange={setMatricule} />
                </div>
                <p className="mt-1.5 text-xs text-ink-faint">Format : 4 chiffres · TU · 3 chiffres (ex. 1234 TU 123)</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Marque" name="marque" value={form.marque} onChange={handleChange} placeholder="Ex. Renault" required />
                <Field label="Modèle" name="modele" value={form.modele} onChange={handleChange} placeholder="Ex. Kangoo" required />
                <SelectField label="Type" name="type" value={form.type} onChange={handleChange} options={VEHICLE_TYPES} required />
                <Field label="Année" name="annee" type="number" value={form.annee} onChange={handleChange} min={1900} max={new Date().getFullYear() + 1} required />
                <Field label="Couleur" name="couleur" value={form.couleur} onChange={handleChange} placeholder="Ex. Blanc" />
                <SelectField label="Statut" name="statut" value={form.statut} onChange={handleChange} options={STATUS_OPTIONS} labels={STATUS_LABELS} />
              </div>
            </div>
          </Section>

          <Section icon={Gauge} title="Caractéristiques techniques" description="Données mécaniques et capacité.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Kilométrage" name="kilometrage" type="number" value={form.kilometrage} onChange={handleChange} placeholder="0" suffix="km" min={0} />
              <SelectField label="Carburant" name="carburant" value={form.carburant} onChange={handleChange} options={CARBURANT_OPTIONS} />
              <SelectField label="Boîte de vitesses" name="boite" value={form.boite} onChange={handleChange} options={BOITE_OPTIONS} />
              <Field label="Puissance fiscale" name="puissance" type="number" value={form.puissance} onChange={handleChange} placeholder="Ex. 6" suffix="CV" min={0} />
              <Field label="Nombre de places" name="nombrePlaces" type="number" value={form.nombrePlaces} onChange={handleChange} placeholder="Ex. 3" min={0} />
            </div>
          </Section>

          <Section icon={ShieldCheck} title="Administratif & documents" description="Échéances réglementaires et carte grise.">
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Mise en circulation" name="dateMiseEnCirculation" type="date" value={form.dateMiseEnCirculation} onChange={handleChange} />
                <Field label="Fin d'assurance" name="assuranceExpiration" type="date" value={form.assuranceExpiration} onChange={handleChange} />
                <Field label="Fin de visite technique" name="visiteTechniqueExpiration" type="date" value={form.visiteTechniqueExpiration} onChange={handleChange} />
              </div>
              <div className="flex flex-col">
                <span className="ui-label">Carte grise</span>
                {showCarteGrise ? (
                  <CarteGrisePreview
                    file={carteGriseFile}
                    existingUrl={form.carteGriseUrl}
                    onRemove={mode === "edit" ? handleRemoveCarteGrise : (() => setCarteGriseFile(null))}
                    onReplace={mode === "edit" ? openFilePicker : undefined}
                  />
                ) : (
                  <button
                    type="button" onClick={openFilePicker}
                    className="group flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-line bg-canvas px-4 py-5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-ink-faint ring-1 ring-inset ring-line transition-colors group-hover:text-brand-600">
                      <Upload size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">Ajouter la carte grise</span>
                      <span className="block text-xs text-ink-muted">JPG, PNG, WEBP ou PDF · 10 Mo maximum</span>
                    </span>
                  </button>
                )}
                <input
                  ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden" onChange={handleFileChange} aria-label="Fichier de carte grise"
                />
              </div>
            </div>
          </Section>

          <Section icon={NotebookPen} title="Remarques" description="Observations internes, équipements, consignes.">
            <label htmlFor="vehicle-notes" className="sr-only">Remarques</label>
            <textarea
              id="vehicle-notes" name="notes" value={form.notes} onChange={handleChange}
              placeholder="Ex. Galerie de toit, kit de secours, clé de rechange au bureau…"
              rows={5} className="ui-textarea"
            />
          </Section>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-24" aria-label="Récapitulatif">
          <div className="ui-card overflow-hidden">
            <div className="bg-ink px-5 pb-5 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Aperçu</p>
              <div className="mt-3 flex items-center justify-between rounded-lg border-2 border-white/80 px-3 py-2.5 font-mono text-lg font-bold tracking-[0.15em] text-white">
                <span>{matricule.left || "····"}</span>
                <span className="font-sans text-sm tracking-normal" lang="ar">تونس</span>
                <span>{matricule.right || "···"}</span>
              </div>
              <p className="mt-3 truncate text-sm font-semibold text-white">{vehicleTitle}</p>
              <p className="text-xs text-white/60">{[form.type, form.annee, form.carburant].filter(Boolean).join(" · ") || "Type · Année"}</p>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-ink-muted">Champs obligatoires</span>
                <span className="text-ink">{completed}/{requiredFields.length}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progression du formulaire">
                <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{ width: progress + "%" }} />
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {requiredFields.map(f => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm">
                    {f.ok
                      ? <CheckCircle2 size={16} className="shrink-0 text-teal-600" aria-hidden="true" />
                      : <Circle size={16} className="shrink-0 text-line" aria-hidden="true" />}
                    <span className={f.ok ? "font-medium text-ink" : "text-ink-muted"}>{f.label}</span>
                    <span className="sr-only">{f.ok ? "renseigné" : "à renseigner"}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {additionalSidebarContent}
        </aside>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-col-reverse gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-end sm:rounded-2xl sm:border sm:px-5">
        {mode === "create" && onReset && (
          <button type="button" onClick={handleReset} className="ui-btn-ghost sm:mr-auto">
            <RotateCcw size={15} aria-hidden="true" /> Réinitialiser
          </button>
        )}
        {onCancel && (
          <button type="button" onClick={onCancel} className="ui-btn-secondary">Annuler</button>
        )}
        <button type="submit" disabled={busy} className="ui-btn-primary">
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
          {submitButtonLabel}
        </button>
      </div>
    </form>
  )
}
