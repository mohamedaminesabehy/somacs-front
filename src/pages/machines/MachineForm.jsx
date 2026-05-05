import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import {
  ChevronLeft, Save, Loader2, Settings, Upload, X, FileText,
  Image as ImageIcon, AlertCircle,
} from 'lucide-react'

const STATUS_OPTIONS = ['Actif', 'Inactif', 'En panne', 'Maintenance']
const CATEGORY_OPTIONS = ['Compresseur', 'Pompe', 'Moteur', 'Groupe électrogène', 'Climatisation', 'Autre']

const EMPTY_FORM = {
  code: '', designation: '', brand: '', model: '', serialNumber: '',
  year: '', client: '', site: '', service: '', unitAmount: '',
  status: 'Actif', category: '', location: '',
  commissioningDate: '', lastMaintenanceDate: '', nextMaintenanceDate: '',
  notes: '',
}

export default function MachineForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const imageInputRef = useRef()

  const [docFiles, setDocFiles] = useState([])
  const [existingDocs, setExistingDocs] = useState([])
  const [docsToRemove, setDocsToRemove] = useState([])
  const docInputRef = useRef()

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    apiFetch(`/machines/${id}`, { auth: true })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setForm({
          code: data.code || '',
          designation: data.designation || '',
          brand: data.brand || '',
          model: data.model || '',
          serialNumber: data.serialNumber || '',
          year: data.year || '',
          client: data.client || '',
          site: data.site || '',
          service: data.service || '',
          unitAmount: data.unitAmount ?? '',
          status: data.status || 'Actif',
          category: data.category || '',
          location: data.location || '',
          commissioningDate: data.commissioningDate || '',
          lastMaintenanceDate: data.lastMaintenanceDate || '',
          nextMaintenanceDate: data.nextMaintenanceDate || '',
          notes: data.notes || '',
        })
        if (data.imageUrl) setExistingImageUrl(data.imageUrl)
        if (data.documentsJson) {
          try { setExistingDocs(JSON.parse(data.documentsJson)) } catch {}
        }
      })
      .catch(() => setError('Impossible de charger la machine.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleDocChange = (e) => {
    const files = Array.from(e.target.files || [])
    setDocFiles(prev => [...prev, ...files])
    e.target.value = ''
  }

  const removeNewDoc = (idx) => setDocFiles(prev => prev.filter((_, i) => i !== idx))

  const removeExistingDoc = (publicId) => {
    setDocsToRemove(prev => [...prev, publicId])
    setExistingDocs(prev => prev.filter(d => d.publicId !== publicId))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.code.trim() || !form.designation.trim()) {
      setError('Le code et la désignation sont obligatoires.')
      return
    }
    setSaving(true)
    setError(null)

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
    if (imageFile) fd.append('image', imageFile)
    docFiles.forEach(f => fd.append('documents', f))
    if (docsToRemove.length) fd.append('removeDocuments', JSON.stringify(docsToRemove))

    try {
      const res = await apiFetch(isEdit ? `/machines/${id}` : '/machines', {
        method: isEdit ? 'PATCH' : 'POST',
        body: fd,
        auth: true,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Erreur lors de la sauvegarde.')
      }
      navigate('/machines', {
        state: { toast: { type: 'success', message: isEdit ? 'Machine mise à jour.' : 'Machine créée avec succès.' } },
      })
    } catch (err) {
      setError(err.message)
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

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/machines')} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-all">
              <ChevronLeft size={20} />
            </button>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">{isEdit ? 'Modifier la machine' : 'Nouvelle machine'}</h1>
              <p className="text-xs text-slate-400 font-medium">{isEdit ? `ID #${id}` : 'Remplissez les informations'}</p>
            </div>
          </div>
          <button
            form="machine-form"
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#0052CC] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-[#0042a3] transition-all active:scale-95 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form id="machine-form" onSubmit={handleSubmit} className="space-y-6">
          <Section title="Informations principales">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Code *" name="code" value={form.code} onChange={handleChange} placeholder="EX-001" />
              <Field label="Désignation *" name="designation" value={form.designation} onChange={handleChange} placeholder="Compresseur d'air" />
              <Field label="Marque" name="brand" value={form.brand} onChange={handleChange} placeholder="Atlas Copco" />
              <Field label="Modèle" name="model" value={form.model} onChange={handleChange} placeholder="GA 15" />
              <Field label="N° de série" name="serialNumber" value={form.serialNumber} onChange={handleChange} placeholder="SN-XXXXXXXX" />
              <Field label="Année" name="year" value={form.year} onChange={handleChange} placeholder="2020" />
              <SelectField label="Statut" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
              <SelectField label="Catégorie" name="category" value={form.category} onChange={handleChange} options={CATEGORY_OPTIONS} placeholder="Sélectionner..." />
            </div>
          </Section>


          <Section title="Localisation & affectation">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Client" name="client" value={form.client} onChange={handleChange} placeholder="Nom du client" />
              <Field label="Site" name="site" value={form.site} onChange={handleChange} placeholder="Site d'installation" />
              <Field label="Service" name="service" value={form.service} onChange={handleChange} placeholder="Service concerné" />
              <Field label="Localisation" name="location" value={form.location} onChange={handleChange} placeholder="Bâtiment A, Salle 3" />
              <Field label="Montant unitaire (DA)" name="unitAmount" type="number" value={form.unitAmount} onChange={handleChange} placeholder="0" />
            </div>
          </Section>

          <Section title="Maintenance">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Mise en service" name="commissioningDate" type="date" value={form.commissioningDate} onChange={handleChange} />
              <Field label="Dernière maintenance" name="lastMaintenanceDate" type="date" value={form.lastMaintenanceDate} onChange={handleChange} />
              <Field label="Prochaine maintenance" name="nextMaintenanceDate" type="date" value={form.nextMaintenanceDate} onChange={handleChange} />
            </div>
          </Section>

          <Section title="Observations">
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Notes, observations, remarques..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </Section>

          <Section title="Image principale">
            <div className="flex items-start gap-4">
              <div className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {imagePreview || existingImageUrl
                  ? <img src={imagePreview || existingImageUrl} alt="preview" className="w-full h-full object-cover" />
                  : <ImageIcon size={28} className="text-slate-300" />
                }
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  <Upload size={14} /> Choisir une image
                </button>
                {(imagePreview || existingImageUrl) && (
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); setExistingImageUrl(null) }}
                    className="flex items-center gap-2 px-4 py-2.5 border border-red-100 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all">
                    <X size={14} /> Supprimer
                  </button>
                )}
                <p className="text-[11px] text-slate-400">JPG, PNG, WEBP — max 5 Mo</p>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            </div>
          </Section>

          <Section title="Documents">
            <div className="space-y-3">
              {existingDocs.map(doc => (
                <div key={doc.publicId} className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-blue-500 shrink-0" />
                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-700 hover:text-blue-600 truncate max-w-xs">{doc.name}</a>
                  </div>
                  <button type="button" onClick={() => removeExistingDoc(doc.publicId)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {docFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-blue-500 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 truncate max-w-xs">{f.name}</span>
                    <span className="text-[10px] text-blue-500 font-bold bg-blue-100 px-2 py-0.5 rounded">Nouveau</span>
                  </div>
                  <button type="button" onClick={() => removeNewDoc(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => docInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:border-blue-300 transition-all w-full justify-center">
                <Upload size={14} /> Ajouter un document
              </button>
              <input ref={docInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg" className="hidden" onChange={handleDocChange} />
            </div>
          </Section>
        </form>
      </main>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-5">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
      />
    </div>
  )
}

function SelectField({ label, name, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
