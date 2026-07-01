
import { useState, useRef, useEffect } from "react"
import {
  Upload, FileText, Gauge, Settings2, ShieldCheck, CheckCircle2,
  Eye, Truck, AlertCircle, X, Loader2, Save
} from "lucide-react"

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

export function MatriculeInput({ left, right, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input type="text" inputMode="numeric" value={left} maxLength={4}
        onChange={e => onChange({ left: e.target.value.replace(/\D/g, "").slice(0, 4), right })}
        placeholder="1234"
        className="w-20 px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-center focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all" />
      <span className="px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm font-black text-blue-700 select-none">TU</span>
      <input type="text" inputMode="numeric" value={right} maxLength={3}
        onChange={e => onChange({ left, right: e.target.value.replace(/\D/g, "").slice(0, 3) })}
        placeholder="123"
        className="w-16 px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-center focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all" />
    </div>
  )
}

export function Field({ label, name, value, onChange, placeholder, type, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        {label}{required && " *"}
      </label>
      <input
        type={type || "text"} name={name}
        value={value != null ? value : ""}
        onChange={onChange} placeholder={placeholder}
        className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
      />
    </div>
  )
}

export function SelectField({ label, name, value, onChange, options, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        {label}{required && " *"}
      </label>
      <select
        name={name} value={value != null ? value : ""} onChange={onChange}
        className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer"
      >
        <option value="">Selectionner...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export function Section({ icon, title, description, accent, children }) {
  const SectionIcon = icon
  const a = accent || "blue"
  const map = {
    blue:  ["from-blue-50/80 border-blue-200",   "bg-blue-100 text-blue-600",   "text-blue-800"],
    teal:  ["from-cyan-50/80 border-cyan-200",   "bg-cyan-100 text-cyan-600",   "text-cyan-800"],
    amber: ["from-amber-50/80 border-amber-200", "bg-amber-100 text-amber-600", "text-amber-800"],
    slate: ["from-slate-50/80 border-slate-200", "bg-slate-100 text-slate-600", "text-slate-700"],
  }
  const [wrap, iconClass, titleCls] = map[a] || map.blue
  return (
    <div className={"bg-gradient-to-br " + wrap + " to-white border rounded-3xl p-5 sm:p-6 space-y-4"}>
      <div className="flex items-start gap-3 pb-1">
        <div className={"w-9 h-9 rounded-xl flex items-center justify-center shrink-0 " + iconClass}>
          <SectionIcon size={17} />
        </div>
        <div>
          <h2 className={"text-[11px] font-black uppercase tracking-[0.22em] " + titleCls}>{title}</h2>
          {description && <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export function CarteGrisePreview({ file, existingUrl, onRemove, onReplace }) {
  const [preview, setPreview] = useState(null)
  const isPdfFile = file && file.type === "application/pdf"
  const isPdfUrl = existingUrl && existingUrl.includes(".pdf")
  useEffect(() => {
    if (!file || isPdfFile) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, isPdfFile])
  
  if (!file && !existingUrl) return null
  
  return (
    <div className="relative group rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {file ? (
        isPdfFile ? (
          <div className="flex items-center gap-3 p-4">
            <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
              <FileText size={22} className="text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
              <p className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(0)} Ko - PDF</p>
            </div>
          </div>
        ) : (
          <div className="h-36 bg-slate-50">
            {preview && <img src={preview} alt="Carte grise" className="w-full h-full object-contain p-2" />}
          </div>
        )
      ) : (
        <div className="h-36 bg-slate-50 flex items-center justify-center">
          {isPdfUrl ? (
            <div className="flex items-center gap-3 p-4">
              <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center">
                <FileText size={22} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Carte grise (PDF)</p>
                <p className="text-[11px] text-slate-400">Fichier existant</p>
              </div>
            </div>
          ) : (
            <img src={existingUrl} alt="Carte grise" className="w-full h-full object-contain p-2" />
          )}
        </div>
      )}
      <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
          <CheckCircle2 size={11} /> {file ? "Nouveau fichier" : "Fichier existant"}
        </span>
        <div className="flex items-center gap-3">
          {existingUrl && !file && (
            <a href={existingUrl} target="_blank" rel="noreferrer"
              className="text-[10px] font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1">
              <Eye size={11} /> Voir
            </a>
          )}
          {onReplace && (
            <button type="button" onClick={onReplace} className="text-[10px] font-bold text-slate-500 hover:text-slate-700">
              Remplacer
            </button>
          )}
          {onRemove && (
            <button type="button" onClick={onRemove} className="text-[10px] font-bold text-red-500 hover:text-red-700">
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VehicleForm({
  mode = "create", // "create" or "edit"
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
      if (setError) setError("Format invalide. Acceptes : JPG, PNG, WEBP, PDF")
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
      await onSubmit({
        form,
        matricule,
        carteGriseFile,
        removeCarteGrise,
      })
    }
  }

  const mat = buildMatricule(matricule.left, matricule.right)
  const showCarteGrise = mode === "create" 
    ? carteGriseFile 
    : (carteGriseFile || (form.carteGriseUrl && !removeCarteGrise))
  const requiredFields = [
    { label: "Matricule (TN)", ok: !!mat },
    { label: "Marque", ok: !!form.marque.trim() },
    { label: "Modele", ok: !!form.modele.trim() },
    { label: "Type", ok: !!form.type },
    { label: "Annee", ok: !!form.annee },
  ]

  let submitButtonLabel = "Enregistrer"
  if (loading) submitButtonLabel = "Creation..."
  else if (saving) submitButtonLabel = "Enregistrement..."

  return (
    <div className="min-h-screen bg-[#F6F9FC]">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
            <AlertCircle size={16} className="shrink-0" />
            <span className="flex-1">{error}</span>
            {setError && (
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <form id={formId} onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-6 items-start">
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Section icon={Truck} title="Identite" description="Informations d'identification" accent="blue">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Matricule tunisien *
                      </label>
                      <MatriculeInput left={matricule.left} right={matricule.right} onChange={setMatricule} />
                      {mat ? (
                        <p className="text-xs font-black text-blue-600 font-mono">{mat}</p>
                      ) : (
                        <p className="text-[10px] text-slate-400">Format : 1234 TU 123</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Marque" name="marque" value={form.marque} onChange={handleChange} placeholder="Ex: Renault" required />
                      <Field label="Modele" name="modele" value={form.modele} onChange={handleChange} placeholder="Ex: Kangoo" required />
                      <SelectField label="Type" name="type" value={form.type} onChange={handleChange} options={VEHICLE_TYPES} required />
                      <Field label="Annee" name="annee" type="number" value={form.annee} onChange={handleChange} required />
                      <Field label="Couleur" name="couleur" value={form.couleur} onChange={handleChange} placeholder="Ex: Blanc" />
                      <SelectField label="Statut" name="statut" value={form.statut} onChange={handleChange} options={STATUS_OPTIONS} />
                    </div>
                  </div>
                </Section>

                <Section icon={Gauge} title="Caracteristiques techniques" description="Donnees mecaniques" accent="teal">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Kilometrage (km)" name="kilometrage" type="number" value={form.kilometrage} onChange={handleChange} placeholder="0" />
                    <SelectField label="Carburant" name="carburant" value={form.carburant} onChange={handleChange} options={CARBURANT_OPTIONS} />
                    <SelectField label="Boite" name="boite" value={form.boite} onChange={handleChange} options={BOITE_OPTIONS} />
                    <Field label="Puissance (CV)" name="puissance" type="number" value={form.puissance} onChange={handleChange} placeholder="Ex: 90" />
                    <Field label="Nb. places" name="nombrePlaces" type="number" value={form.nombrePlaces} onChange={handleChange} placeholder="Ex: 5" />
                  </div>
                </Section>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Section icon={ShieldCheck} title="Administratif" description="Documents et dates reglementaires" accent="amber">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Mise en circulation" name="dateMiseEnCirculation" type="date" value={form.dateMiseEnCirculation} onChange={handleChange} />
                      <div />
                      <Field label="Assurance - expiration" name="assuranceExpiration" type="date" value={form.assuranceExpiration} onChange={handleChange} />
                      <Field label="Visite technique - expiration" name="visiteTechniqueExpiration" type="date" value={form.visiteTechniqueExpiration} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Carte grise</label>
                      {showCarteGrise ? (
                        <CarteGrisePreview 
                          file={carteGriseFile} 
                          existingUrl={form.carteGriseUrl}
                          onRemove={mode === "edit" ? handleRemoveCarteGrise : (() => setCarteGriseFile(null))}
                          onReplace={mode === "edit" ? (() => { if (fileInputRef.current) fileInputRef.current.click() }) : undefined}
                        />
                      ) : (
                        <div
                          onClick={() => { if (fileInputRef.current) fileInputRef.current.click() }}
                          className="border-2 border-dashed border-amber-200 rounded-2xl p-5 text-center hover:border-amber-400 hover:bg-amber-50/40 transition-all cursor-pointer group"
                        >
                          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-2 text-slate-300 group-hover:text-amber-500 transition-colors border border-slate-200">
                            <Upload size={18} />
                          </div>
                          <p className="text-xs font-bold text-slate-500 group-hover:text-amber-600 transition-colors">
                            Ajouter la carte grise
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP ou PDF - Max 10 Mo</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef} 
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </Section>

                <Section icon={Settings2} title="Remarques" description="Notes et observations" accent="slate">
                  <textarea
                    name="notes" 
                    value={form.notes} 
                    onChange={handleChange}
                    placeholder="Notes, observations, informations complementaires..."
                    rows={8}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all resize-none"
                  />
                </Section>
              </div>
            </div>

            <aside className="xl:sticky xl:top-24 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-4">Champs requis</p>
                <ul className="space-y-2.5">
                  {requiredFields.map(function(f) {
                    return (
                      <li key={f.label} className="flex items-center gap-2.5">
                        <span className={"w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors " + (f.ok ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300")}>
                          {f.ok ? <CheckCircle2 size={12} /> : <span className="w-2 h-2 rounded-full bg-slate-300 block" />}
                        </span>
                        <span className={"text-sm transition-colors " + (f.ok ? "text-slate-800 font-semibold" : "text-slate-400")}>{f.label}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600 mb-2">Format matricule</p>
                <p className="text-lg font-black text-blue-900 font-mono tracking-wider">1234 TU 123</p>
                <p className="text-[11px] text-blue-500 mt-1">4 chiffres - TU - 3 chiffres</p>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-3">Flux conseille</p>
                <ol className="space-y-2.5">
                  {["Matricule + identite", "Caracteristiques techniques", "Dates + carte grise"].map(function(step, i) {
                    return (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-xs text-slate-300 leading-5">{step}</span>
                      </li>
                    )
                  })}
                </ol>
              </div>

              {additionalSidebarContent}
            </aside>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            {mode === "create" && onReset && (
              <button type="button" onClick={handleReset}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-colors">
                Reinitialiser
              </button>
            )}
            {onCancel && (
              <button type="button" onClick={onCancel}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-colors">
                Annuler
              </button>
            )}
            <button type="submit" disabled={loading || saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-60 shadow-lg shadow-blue-200">
              {loading || saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {submitButtonLabel}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
