import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import { ChevronLeft, ChevronDown, Save, Loader2, Upload, X, FileText, Image as ImageIcon, AlertCircle, Cpu, Truck, ClipboardCheck, Shield, CheckCircle2, ImagePlus, Hash, Calendar, Tag, Wrench, MapPin, Package, Clock } from 'lucide-react'
import { getStepLabelColor } from '../../utils/stepStyles'

const STATUS_OPTIONS = ['En stock', 'Disponible', 'En utilisation', 'En maintenance', 'Hors service']
const CATEGORY_OPTIONS = ['Compresseur', 'Pompe', 'Moteur', 'Groupe electrogene', 'Climatisation', 'Autre']
const ETAT_RECEPTION_OPTIONS = ['Neuf', 'Occasion', 'A verifier', 'Endommage']
const ETAT_GENERAL_OPTIONS = ['Conforme', 'A verifier', 'Non conforme']
const TEST_OPTIONS = ['Non teste', 'Teste OK', 'Teste avec remarque', 'Echec test']
const OUI_NON_PARTIEL = ['Oui', 'Non', 'Partiel']
const OUI_NON = ['Oui', 'Non']
const ACTION_OPTIONS = ['Prete a livrer', 'Reparation necessaire', 'Verification technique', 'Pieces manquantes']
const EMPLACEMENT_OPTIONS = ['Magasin', 'Showroom 1', 'Showroom 2']

const STEPS = [
  { id: 1, title: 'Origine', description: 'Fournisseur', icon: Truck },
  { id: 2, title: 'Machine', description: 'Identification', icon: Cpu },
  { id: 3, title: 'Contrôle', description: 'Avant livraison', icon: ClipboardCheck },
  { id: 4, title: 'Médias', description: 'Images & docs', icon: ImagePlus },
]

const EMPTY_FORM = { code: '', designation: '', brand: '', model: '', serialNumber: '', year: '', category: '', status: 'En stock', supplier: '', referenceFournisseur: '', receptionDate: '', purchaseOrderNumber: '', warrantyEndDate: '', dureeGarantie: '', etatReception: '', observationsReception: '', etatGeneral: '', testFonctionnement: '', accessoiresPresents: '', documentsPresents: '', problemeConstate: '', descriptionProbleme: '', actionRecommandee: '', valideParControle: '', dateControle: '', emplacementInterne: '' }

export default function MachineForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [activeStep, setActiveStep] = useState(1)
  const [traceability, setTraceability] = useState({ createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' })
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const imageInputRef = useRef()
  const [docFiles, setDocFiles] = useState([])
  const [existingDocs, setExistingDocs] = useState([])
  const [docsToRemove, setDocsToRemove] = useState([])
  const [imagesToRemove, setImagesToRemove] = useState([])
  const docInputRef = useRef()

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    apiFetch('/machines/' + id, { auth: true })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const f = {}
        Object.keys(EMPTY_FORM).forEach((k) => { f[k] = data[k] || '' })
        setForm(f)
        setTraceability({ createdBy: data.createdBy || '', updatedBy: data.updatedBy || '', createdAt: data.createdAt || '', updatedAt: data.updatedAt || '' })
        if (data.imagesJson) {
          try {
            const imgs = JSON.parse(data.imagesJson)
            if (Array.isArray(imgs)) setExistingImages(imgs)
          } catch {
            // Existing image metadata is optional.
          }
        } else if (data.imageUrl) {
          setExistingImages([{ publicId: data.imagePublicId || null, url: data.imageUrl, name: 'Image machine' }])
        }
        if (data.documentsJson) {
          try {
            setExistingDocs(JSON.parse(data.documentsJson))
          } catch {
            // Existing document metadata is optional.
          }
        }
      })
      .catch(() => setError('Impossible de charger la machine.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (fieldErrors[name]) setFieldErrors((p) => { const n = { ...p }; delete n[name]; return n })
  }
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setImageFiles((prev) => [...prev, ...files])
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
    e.target.value = ''
  }
  const clearImage = (index, type) => {
    if (type === 'existing') {
      const img = existingImages[index]
      const key = img.publicId || `url:${img.url}`
      setExistingImages((prev) => prev.filter((_, i) => i !== index))
      setImagesToRemove((prev) => [...prev, key])
    } else {
      setImageFiles((prev) => prev.filter((_, i) => i !== index))
      setImagePreviews((prev) => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index) })
    }
  }
  const handleDocChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setDocFiles((p) => [...p, ...files])
    e.target.value = ''
  }
  const removeNewDoc = (idx) => setDocFiles((p) => p.filter((_, i) => i !== idx))
  const removeExistingDoc = (pid) => { setDocsToRemove((p) => [...p, pid]); setExistingDocs((p) => p.filter((d) => d.publicId !== pid)) }

  const validate = () => {
    const errs = {}
    if (!form.code.trim()) errs.code = 'Obligatoire'
    if (!form.designation.trim()) errs.designation = 'Obligatoire'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Only allow submission from the final step
    if (activeStep < STEPS.length) return
    setError(null)
    if (!validate()) { setError('Champs obligatoires manquants.'); return }
    setSaving(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
    imageFiles.forEach((f) => fd.append('images', f))
    docFiles.forEach((f) => fd.append('documents', f))
    if (docsToRemove.length) fd.append('removeDocuments', JSON.stringify(docsToRemove))
    if (imagesToRemove.length) fd.append('removeImages', JSON.stringify(imagesToRemove))
    try {
      const url = isEdit ? '/machines/' + id : '/machines'
      const res = await apiFetch(url, { method: isEdit ? 'PATCH' : 'POST', body: fd, auth: true })
      if (!res.ok) { const r = await res.json().catch(() => ({})); throw new Error(r.message || 'Erreur') }
      navigate('/machines', { state: { toast: { type: 'success', message: 'OK' } } })
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  const totalDocs = existingDocs.length + docFiles.length
  const totalImages = existingImages.length + imageFiles.length

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#0052CC]" />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b-2 border-slate-200 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/machines')}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition-all active:scale-95 shadow-sm shrink-0"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">
                {isEdit ? 'Modifier la machine' : 'Nouvelle Machine'}
              </h1>
              <span className="hidden sm:inline px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-lg shadow-blue-200 shrink-0">
                Équipement SOMACS
              </span>
            </div>
            <p className="hidden sm:flex text-slate-500 text-sm font-semibold mt-1 items-center gap-2">
              <Calendar size={14} />
              Enregistrement et suivi des équipements internes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/machines')}
            className="hidden sm:flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            Annuler
          </button>
          <button
            form="machine-form"
            type="submit"
            disabled={saving || activeStep < STEPS.length}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">Enregistrer</span>
          </button>
        </div>
      </div>

      {/* Mobile horizontal stepper (visible on small screens only) */}
      <div className="lg:hidden bg-white border-b border-slate-100 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {STEPS.map((step, index) => {
            const isActive = activeStep === step.id
            const isCompleted = activeStep > step.id
            const Icon = step.icon
            return (
              <div key={step.id} className="contents">
                <button
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isActive ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-200 scale-110'
                    : isCompleted ? 'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={16} strokeWidth={3} /> : <Icon size={16} />}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wide ${getStepLabelColor(isActive, isCompleted)}`}>
                    {step.title}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors duration-300 ${activeStep > step.id ? 'bg-green-400' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* Desktop vertical stepper sidebar */}
        <div className="hidden lg:flex w-[300px] border-r border-slate-100 bg-slate-50/30 flex-col p-8 shrink-0 min-w-0">
          <div className="space-y-2 mb-12">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Progression</h4>
            <div className="h-1 w-12 bg-[#0052CC] rounded-full"></div>
          </div>

          <div className="space-y-1">
            {STEPS.map((step) => {
              const isActive = activeStep === step.id
              const isCompleted = activeStep > step.id
              const Icon = step.icon
              return (
                <div key={step.id} className="relative pb-10 last:pb-0">
                  {step.id !== STEPS.length && (
                    <div className={`absolute left-6 top-14 bottom-0 w-0.5 rounded-full ${isCompleted ? 'bg-[#0052CC]' : 'bg-slate-100'}`}></div>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className="flex items-start gap-5 group cursor-pointer w-full text-left"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 z-10 ${
                      isActive
                        ? 'bg-[#0052CC] text-white shadow-xl shadow-blue-200 scale-110'
                        : isCompleted
                          ? 'bg-green-500 text-white shadow-lg shadow-green-100'
                          : 'bg-white text-slate-300 border-2 border-slate-100 group-hover:border-slate-200'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={20} className="stroke-[3px]" /> : <Icon size={20} className={isActive ? 'stroke-[3px]' : 'stroke-[2px]'} />}
                    </div>
                    <div className="pt-1">
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 transition-colors ${isActive ? 'text-[#0052CC]' : 'text-slate-300'}`}>Étape 0{step.id}</p>
                      <p className={`text-base font-black tracking-tight transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</p>
                      <p className={`text-[11px] font-bold mt-0.5 transition-colors ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>{step.description}</p>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 overflow-y-auto bg-white min-w-0">
          <div className="px-5 sm:px-10 lg:px-14 py-8 sm:py-10 w-full">
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-5 text-red-700 animate-in fade-in duration-300 mb-6">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            <form id="machine-form" onSubmit={handleSubmit} noValidate className="space-y-8">
              {activeStep === 1 && <Step1 form={form} handleChange={handleChange} />}
              {activeStep === 2 && <Step2 form={form} handleChange={handleChange} fieldErrors={fieldErrors} />}
              {activeStep === 3 && <Step3 form={form} handleChange={handleChange} />}
              {activeStep === 4 && (
                <Step4
                  imagePreviews={imagePreviews} existingImages={existingImages}
                  imageInputRef={imageInputRef} handleImageChange={handleImageChange} clearImage={clearImage}
                  totalImages={totalImages}
                  totalDocs={totalDocs} existingDocs={existingDocs} docFiles={docFiles}
                  removeExistingDoc={removeExistingDoc} removeNewDoc={removeNewDoc}
                  docInputRef={docInputRef} handleDocChange={handleDocChange}
                  isEdit={isEdit} traceability={traceability}
                />
              )}
              <Nav activeStep={activeStep} setActiveStep={setActiveStep} saving={saving} />
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Step 1: Origine & Fournisseur ─── */
function Step1({ form, handleChange }) {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <SectionHeader
        icon={Truck}
        color="blue"
        title="Origine & Fournisseur"
        desc="Provenance, réception et informations de garantie"
      />

      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Fournisseur" icon={Package} name="supplier" value={form.supplier} onChange={handleChange} placeholder="Nom du fournisseur" />
          <Field label="Référence fournisseur" icon={Hash} name="referenceFournisseur" value={form.referenceFournisseur} onChange={handleChange} placeholder="REF-XXX" />
          <Field label="Date d'arrivée" icon={Calendar} name="receptionDate" type="date" value={form.receptionDate} onChange={handleChange} />
          <Field label="Facture / BL" icon={FileText} name="purchaseOrderNumber" value={form.purchaseOrderNumber} onChange={handleChange} placeholder="N° document" />
          <Field label="Fin de garantie" icon={Calendar} name="warrantyEndDate" type="date" value={form.warrantyEndDate} onChange={handleChange} />
          <Field label="Durée garantie" icon={Clock} name="dureeGarantie" value={form.dureeGarantie} onChange={handleChange} placeholder="12 mois" />
          <SelectField label="État réception" name="etatReception" value={form.etatReception} onChange={handleChange} options={ETAT_RECEPTION_OPTIONS} />
        </div>

        <div className="mt-6">
          <TextareaField label="Observations" name="observationsReception" value={form.observationsReception} onChange={handleChange} placeholder="Remarques à la réception..." />
        </div>
      </div>
    </div>
  )
}

/* ─── Step 2: Identification Machine ─── */
function Step2({ form, handleChange, fieldErrors }) {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <SectionHeader
        icon={Cpu}
        color="indigo"
        title="Identification Machine"
        desc="Code interne, caractéristiques techniques et statut"
      />

      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Code interne" icon={Hash} name="code" value={form.code} onChange={handleChange} placeholder="MACH-001" required error={fieldErrors.code} dotColor="bg-[#0052CC]" />
          <Field label="Désignation" icon={Tag} name="designation" value={form.designation} onChange={handleChange} placeholder="Compresseur à vis" required error={fieldErrors.designation} dotColor="bg-[#0052CC]" />
          <Field label="Marque" icon={Package} name="brand" value={form.brand} onChange={handleChange} placeholder="Atlas Copco" />
          <Field label="Modèle" name="model" value={form.model} onChange={handleChange} placeholder="GA 15" />
          <Field label="N° de série" icon={Cpu} name="serialNumber" value={form.serialNumber} onChange={handleChange} placeholder="SN-XXX" mono />
          <Field label="Année" icon={Calendar} name="year" value={form.year} onChange={handleChange} placeholder="2024" type="number" />
          <SelectField label="Catégorie" name="category" value={form.category} onChange={handleChange} options={CATEGORY_OPTIONS} />
          <SelectField label="Statut" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-[#0052CC] text-white rounded-xl flex items-center justify-center shrink-0">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="font-black text-blue-900 text-sm mb-1">Champs obligatoires</h4>
          <p className="text-blue-800 text-xs leading-relaxed">Le code interne et la désignation sont requis pour identifier la machine dans le système.</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Step 3: Contrôle avant livraison ─── */
function Step3({ form, handleChange }) {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <SectionHeader
        icon={ClipboardCheck}
        color="emerald"
        title="Contrôle Avant Livraison"
        desc="Vérification technique et validation avant affectation"
      />

      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField label="Emplacement machine" name="emplacementInterne" value={form.emplacementInterne} onChange={handleChange} options={EMPLACEMENT_OPTIONS} />
          <SelectField label="État général" name="etatGeneral" value={form.etatGeneral} onChange={handleChange} options={ETAT_GENERAL_OPTIONS} />
          <SelectField label="Test fonctionnement" name="testFonctionnement" value={form.testFonctionnement} onChange={handleChange} options={TEST_OPTIONS} />
          <SelectField label="Accessoires présents" name="accessoiresPresents" value={form.accessoiresPresents} onChange={handleChange} options={OUI_NON_PARTIEL} />
          <SelectField label="Documents présents" name="documentsPresents" value={form.documentsPresents} onChange={handleChange} options={OUI_NON_PARTIEL} />
          <SelectField label="Problème constaté" name="problemeConstate" value={form.problemeConstate} onChange={handleChange} options={OUI_NON} />
          <SelectField label="Action recommandée" name="actionRecommandee" value={form.actionRecommandee} onChange={handleChange} options={ACTION_OPTIONS} />
          <Field label="Validé par" icon={Shield} name="valideParControle" value={form.valideParControle} onChange={handleChange} placeholder="Responsable" />
          <Field label="Date contrôle" icon={Calendar} name="dateControle" type="date" value={form.dateControle} onChange={handleChange} />
        </div>

        {form.problemeConstate === 'Oui' && (
          <div className="mt-6">
            <TextareaField label="Description du problème" name="descriptionProbleme" value={form.descriptionProbleme} onChange={handleChange} placeholder="Décrivez le problème constaté..." />
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Step 4: Images & Documents ─── */
function Step4({ imagePreviews, existingImages, imageInputRef, handleImageChange, clearImage, totalImages, totalDocs, existingDocs, docFiles, removeExistingDoc, removeNewDoc, docInputRef, handleDocChange, isEdit, traceability }) {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <SectionHeader
        icon={ImagePlus}
        color="violet"
        title="Images & Documents"
        desc="Photos de la machine et fichiers techniques associés"
      />

      {/* Images */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
            <ImageIcon size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Images de la machine</h3>
            <p className="text-xs text-slate-500">JPG, PNG, WEBP — max 5 Mo par image — jusqu'à 10 images</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Grid of existing + new images */}
          {totalImages > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {existingImages.map((img, idx) => (
                <div key={img.publicId || idx} className="relative group">
                  <div className="w-full aspect-square rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-50">
                    <img src={img.url} alt={img.name || 'image'} className="w-full h-full object-cover" />
                  </div>
                  <button type="button" onClick={() => clearImage(idx, 'existing')} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {imagePreviews.map((src, idx) => (
                <div key={'new-' + idx} className="relative group">
                  <div className="w-full aspect-square rounded-2xl border-2 border-blue-200 overflow-hidden bg-blue-50">
                    <img src={src} alt="nouvelle image" className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute top-2 left-2 rounded-full bg-blue-500 text-white px-2 py-0.5 text-[9px] font-black uppercase">Nouveau</span>
                  <button type="button" onClick={() => clearImage(idx, 'new')} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {totalImages === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
              <ImageIcon size={28} />
              <p className="text-sm font-medium">Aucune image ajoutée</p>
            </div>
          )}

          <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-600 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50/30 transition-all">
            <Upload size={16} /> Ajouter des images
          </button>
          <input ref={imageInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Documents techniques</h3>
            <p className="text-xs text-slate-500">Fiches techniques, manuels, certificats — PDF, Word, Excel</p>
          </div>
        </div>

        <div className="space-y-3">
          {totalDocs === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
              <FileText size={28} />
              <p className="text-sm font-medium">Aucun document ajouté</p>
            </div>
          )}
          {existingDocs.map((doc) => <DocRow key={doc.publicId} name={doc.name} href={doc.url} onRemove={() => removeExistingDoc(doc.publicId)} />)}
          {docFiles.map((f, i) => <DocRow key={'new-' + i} name={f.name} isNew onRemove={() => removeNewDoc(i)} />)}
          <button type="button" onClick={() => docInputRef.current?.click()} className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-600 hover:border-[#0052CC] hover:text-[#0052CC] hover:bg-blue-50/30 transition-all">
            <Upload size={16} /> Ajouter un document
          </button>
          <input ref={docInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleDocChange} />
        </div>
      </div>

      {/* Traçabilité */}
      {isEdit && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Traçabilité</h3>
              <p className="text-xs text-slate-500">Informations automatiques</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ReadOnlyField label="Créé par" value={traceability.createdBy || '—'} />
            <ReadOnlyField label="Ajouté le" value={traceability.createdAt ? new Date(traceability.createdAt).toLocaleString('fr-FR') : '—'} />
            <ReadOnlyField label="Modifié par" value={traceability.updatedBy || '—'} />
            <ReadOnlyField label="Modifié le" value={traceability.updatedAt ? new Date(traceability.updatedAt).toLocaleString('fr-FR') : '—'} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Navigation ─── */
function Nav({ activeStep, setActiveStep, saving }) {
  return (
    <div className="mt-10 pt-8 border-t-2 border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <button
        type="button"
        onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
        disabled={activeStep === 1}
        className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
          activeStep === 1
            ? 'text-slate-300 cursor-not-allowed bg-slate-50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 shadow-sm hover:shadow-md border-2 border-slate-200'
        }`}
      >
        <ChevronLeft size={18} /> Précédent
      </button>
      {activeStep < STEPS.length ? (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setActiveStep((s) => Math.min(STEPS.length, s + 1)) }}
          className="group flex items-center justify-center gap-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-[#0052CC] hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-slate-300 hover:shadow-blue-300 active:scale-95"
        >
          Suivant <ChevronLeft size={18} className="rotate-180 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
        </button>
      ) : (
        <button
          form="machine-form"
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-green-300 active:scale-95 disabled:opacity-60"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Enregistrer
        </button>
      )}
    </div>
  )
}

/* ─── Section Header ─── */
function SectionHeader({ icon, color, title, desc }) {
  const SectionIcon = icon
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    indigo: 'from-indigo-500 to-indigo-600',
    emerald: 'from-emerald-500 to-emerald-600',
    violet: 'from-violet-500 to-violet-600',
  }
  return (
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 bg-gradient-to-br ${colors[color] || colors.blue} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
        <SectionIcon size={24} />
      </div>
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 font-medium">{desc}</p>
      </div>
    </div>
  )
}

/* ─── Field Components ─── */
function Field({ label, icon: Icon, name, value, onChange, placeholder, type = 'text', required, error, dotColor, mono }) {
  return (
    <div className="space-y-2.5 group">
      <label htmlFor={name} className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
        <span className={`w-2 h-2 rounded-full ${dotColor || (required ? 'bg-[#0052CC]' : 'bg-slate-300')}`}></span>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={18} />}
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-12' : 'px-5'} pr-4 py-3.5 bg-white border-2 rounded-xl outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal shadow-sm hover:border-slate-300 ${mono ? 'font-mono tracking-wider' : ''} ${error ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' : 'border-slate-200 focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10'}`}
        />
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  )
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div className="space-y-2.5 group">
      <label htmlFor={name} className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
        <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
        {label}
      </label>
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-5 py-3.5 pr-10 bg-white border-2 border-slate-200 rounded-xl outline-none appearance-none transition-all text-slate-800 font-semibold shadow-sm hover:border-slate-300 focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 cursor-pointer"
        >
          <option value="">Sélectionner...</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  )
}

function TextareaField({ label, name, value, onChange, placeholder }) {
  return (
    <div className="space-y-2.5 group">
      <label htmlFor={name} className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
        <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={3}
        placeholder={placeholder}
        className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal resize-y shadow-sm hover:border-slate-300 focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 leading-relaxed"
      />
    </div>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-center px-5 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700">
        {value}
      </div>
    </div>
  )
}

function DocRow({ name, href, isNew, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <FileText size={16} className="text-slate-400 shrink-0" />
        {href
          ? <a href={href} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-700 hover:text-[#0052CC] truncate transition-colors">{name}</a>
          : <span className="text-sm font-bold text-slate-700 truncate">{name}</span>
        }
        {isNew && <span className="shrink-0 rounded-full bg-blue-50 text-[#0052CC] border border-blue-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">Nouveau</span>}
      </div>
      <button type="button" onClick={onRemove} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
        <X size={16} />
      </button>
    </div>
  )
}
