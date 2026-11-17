/**
 * MachineClientForm — Formulaire Premium de création/modification d'une Machine Client.
 *
 * Structure : wizard 4 étapes, même design que MachineForm.jsx (Machine SOMACS)
 * mais avec une étape "Client propriétaire" à la place de "Origine & fournisseur".
 *
 * Étapes :
 *   1. Client       — Sélection du client propriétaire (obligatoire)
 *   2. Identification — Désignation, marque, modèle, n° de série
 *   3. Localisation — Site habituel, contact sur site, lieu d'intervention
 *   4. Médias       — Photos, documents, traçabilité
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import {
  AlertCircle, AlertTriangle, Barcode, Building2, Check, ChevronLeft, ChevronRight,
  Cpu, FileText, Hash, Image as ImageIcon, ImagePlus, Loader2, Mail,
  MapPin, Phone, RefreshCw, Save, Search, Shield, Tag, Upload, User, Wrench, X,
} from 'lucide-react'
import logo from '../../assets/logo.jpg'

// ─── Constantes ────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['En service', 'En panne', 'En maintenance', 'Hors service']
const CATEGORY_OPTIONS = ['Compresseur', 'Pompe', 'Moteur', 'Groupe électrogène', 'Climatisation', 'Autre']
const WORKSHOP_OPTIONS = [
  { value: '', label: 'Non précisé' },
  { value: 'AT_CLIENT_SITE', label: 'Sur site client' },
  { value: 'IN_WORKSHOP',    label: 'En atelier SOMACS' },
]

const STEPS = [
  { id: 1, title: 'Client',         description: 'Propriétaire',        icon: User },
  { id: 2, title: 'Identification', description: 'Désignation & référence', icon: Cpu },
  { id: 3, title: 'Localisation',   description: 'Site & contact',       icon: MapPin },
  { id: 4, title: 'Médias',         description: 'Photos & documents',   icon: ImagePlus },
]

const EMPTY_FORM = {
  // Identification
  designation: '', brand: '', model: '', serialNumber: '', year: '', category: '', status: 'En service', notes: '',
  // Localisation habituelle Machine Client
  clientSite: '', clientContact: '', clientContactPhone: '',
  workshopStatus: '', workshopReceivedAt: '', workshopReturnedAt: '', workshopNotes: '',
  // Toujours CLIENT
  ownerType: 'CLIENT',
}

const TRACKED_FIELDS = ['designation', 'brand', 'model', 'serialNumber', 'clientSite', 'clientContact']

// ─── Composants UI locaux ──────────────────────────────────────────────────

function FormPanel({ title, icon: Icon, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      <header className="flex items-center gap-2 border-b border-line bg-slate-50/60 px-4 py-2.5 sm:px-5">
        {Icon && <Icon size={13} className="text-brand-700" aria-hidden="true" />}
        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">{title}</h3>
      </header>
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2">{children}</div>
    </section>
  )
}

function Field({ label, name, value, onChange, placeholder, type = 'text', required, error, mono, hint, wide }) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? 'md:col-span-2' : ''}`}>
      <label htmlFor={`field-${name}`} className="text-xs font-semibold text-ink-soft">
        {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
      </label>
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
      <input
        id={`field-${name}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-err` : undefined}
        className={[
          'ui-input',
          mono ? 'font-mono tracking-wide' : '',
          error ? 'border-red-300 ring-4 ring-red-100' : '',
        ].join(' ')}
      />
      {error && <p id={`${name}-err`} role="alert" className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

function SelectField({ label, name, value, onChange, options, wide }) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? 'md:col-span-2' : ''}`}>
      <label htmlFor={`sel-${name}`} className="text-xs font-semibold text-ink-soft">{label}</label>
      <select id={`sel-${name}`} name={name} value={value} onChange={onChange} className="ui-select">
        {options.map((o) =>
          typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>,
        )}
      </select>
    </div>
  )
}

function TextareaField({ label, name, value, onChange, placeholder, wide }) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? 'md:col-span-2' : ''}`}>
      <label htmlFor={`ta-${name}`} className="text-xs font-semibold text-ink-soft">{label}</label>
      <textarea
        id={`ta-${name}`}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="ui-textarea"
      />
    </div>
  )
}

// ─── Étape 1 : Sélecteur Client ─────────────────────────────────────────────

function ClientStep({ selectedClient, onSelect, fieldError }) {
  const [query, setQuery] = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef(null)

  const searchClients = useCallback(async (q) => {
    setLoading(true)
    setSearched(false)
    try {
      const res = await apiFetch(`/clients?search=${encodeURIComponent(q)}&limit=20`, { auth: true })
      if (!res.ok) return
      const data = await res.json()
      setClients(Array.isArray(data) ? data : (data.data || []))
    } catch { /* silent */ } finally {
      setLoading(false)
      setSearched(true)
    }
  }, [])

  // Charger immédiatement une liste courte pour faciliter le choix
  useEffect(() => {
    searchClients('')
  }, [searchClients])

  const handleQueryChange = (e) => {
    const v = e.target.value
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchClients(v), 280)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Info règle métier */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
        <Shield size={15} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-brand-800">
          Une <strong>Machine Client</strong> reste la propriété du client même lorsqu'elle est
          temporairement en atelier SOMACS pour réparation.
        </p>
      </div>

      {/* Recherche client */}
      <section className="overflow-hidden rounded-xl border border-line bg-white">
        <header className="flex items-center gap-2 border-b border-line bg-slate-50/60 px-4 py-2.5 sm:px-5">
          <User size={13} className="text-brand-700" aria-hidden="true" />
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
            Client propriétaire <span className="text-red-500 normal-case">*</span>
          </h3>
        </header>
        <div className="p-4 sm:p-5">
          {selectedClient ? (
            <ClientCard client={selectedClient} onClear={() => onSelect(null)} />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Rechercher par nom, code, ville…"
                  aria-label="Rechercher un client"
                  className="ui-input pl-10"
                />
              </div>

              {fieldError && (
                <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertTriangle size={13} aria-hidden="true" /> {fieldError}
                </p>
              )}

              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-brand-600" aria-label="Chargement…" />
                </div>
              )}

              {!loading && searched && clients.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Building2 size={22} className="text-ink-faint" aria-hidden="true" />
                  <p className="text-sm font-medium text-ink">Aucun client trouvé</p>
                  <p className="text-xs text-ink-muted">Modifiez la recherche ou créez d'abord le client.</p>
                  <Link to="/clients" className="ui-btn-secondary mt-1 text-xs">
                    Gérer les clients
                  </Link>
                </div>
              )}

              {!loading && clients.length > 0 && (
                <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                  {clients.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(c)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-navy font-display text-sm font-bold text-white">
                          {String(c.name || '').charAt(0).toUpperCase() || '?'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">{c.name}</span>
                          <span className="block text-xs text-ink-muted">
                            <span className="font-mono">{c.code}</span>
                            {c.city ? ` · ${c.city}` : ''}
                          </span>
                        </span>
                        {c.phone && (
                          <span className="shrink-0 text-xs text-ink-faint">{c.phone}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function ClientCard({ client, onClear }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy text-white shadow-raised">
      <div className="ui-blueprint pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="relative flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 font-display text-xl font-bold ring-1 ring-inset ring-white/20">
          {String(client.name || '').charAt(0).toUpperCase() || '?'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-200">Client propriétaire</p>
          <p className="mt-0.5 truncate font-display text-lg font-bold">{client.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-100/80">
            <span className="font-mono font-semibold">{client.code}</span>
            {client.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone size={11} aria-hidden="true" /> {client.phone}
              </span>
            )}
            {(client.city || client.address) && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} aria-hidden="true" /> {client.city || client.address}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-navy transition-colors hover:bg-brand-50"
        >
          <RefreshCw size={14} aria-hidden="true" /> Changer
        </button>
      </div>
    </div>
  )
}

// ─── Étape 2 : Identification ──────────────────────────────────────────────

function IdentificationStep({ form, handleChange, fieldErrors, duplicate }) {
  return (
    <>
      {duplicate && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Machine potentiellement existante</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
              Une machine avec ce numéro de série existe déjà pour ce client.
              Vérifiez qu'il ne s'agit pas d'un doublon avant de continuer.
            </p>
          </div>
        </div>
      )}

      <FormPanel title="Identité de la machine" icon={Cpu}>
        <Field
          label="Désignation"
          name="designation"
          value={form.designation}
          onChange={handleChange}
          placeholder="Ex : Compresseur à vis 15 kW"
          required
          error={fieldErrors.designation}
          wide
        />
        <Field label="Marque" name="brand" value={form.brand} onChange={handleChange} placeholder="Atlas Copco" />
        <Field label="Modèle" name="model" value={form.model} onChange={handleChange} placeholder="GA 15" />
        <Field
          label="Numéro de série"
          name="serialNumber"
          value={form.serialNumber}
          onChange={handleChange}
          placeholder="SN-XXXXXXX"
          mono
        />
        <Field label="Année de fabrication" name="year" value={form.year} onChange={handleChange} type="number" placeholder="2022" />
        <SelectField label="Catégorie" name="category" value={form.category} onChange={handleChange} options={['', ...CATEGORY_OPTIONS]} />
        <SelectField label="Statut" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
      </FormPanel>

      <FormPanel title="Observations" icon={FileText}>
        <TextareaField
          label="Informations complémentaires"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Particularités techniques, historique connu, points d'attention…"
          wide
        />
      </FormPanel>
    </>
  )
}

// ─── Étape 3 : Localisation ────────────────────────────────────────────────

function LocalisationStep({ form, handleChange, selectedClient }) {
  const fillFromClient = () => {
    if (!selectedClient) return
    handleChange({ target: { name: 'clientSite', value: selectedClient.address || selectedClient.city || '' } })
    handleChange({ target: { name: 'clientContactPhone', value: selectedClient.phone || '' } })
  }

  return (
    <>
      <div className="flex items-start gap-3 rounded-xl border border-line bg-slate-50/60 px-4 py-3">
        <MapPin size={15} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-ink-muted">
          Indiquez <strong>l'emplacement habituel</strong> de la machine chez son propriétaire.
          Ce n'est pas le lieu d'intervention — la machine peut être réparée en atelier SOMACS
          sans que son emplacement habituel ne change.
        </p>
      </div>

      <FormPanel title="Site habituel du client" icon={MapPin}>
        <div className="flex flex-col gap-3 md:col-span-2">
          <Field
            label="Site / adresse du client"
            name="clientSite"
            value={form.clientSite}
            onChange={handleChange}
            placeholder="Atelier principal, Rue des Usines, Tunis"
            wide
          />
          {selectedClient && (
            <button
              type="button"
              onClick={fillFromClient}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-700"
            >
              <RefreshCw size={12} aria-hidden="true" />
              Reprendre l'adresse du client ({selectedClient.city || selectedClient.address || selectedClient.name})
            </button>
          )}
        </div>
        <Field
          label="Personne à contacter sur site"
          name="clientContact"
          value={form.clientContact}
          onChange={handleChange}
          placeholder="Nom du responsable maintenance"
        />
        <Field
          label="Téléphone du contact"
          name="clientContactPhone"
          value={form.clientContactPhone}
          onChange={handleChange}
          placeholder="+216 XX XXX XXX"
          type="tel"
        />
      </FormPanel>

      <FormPanel title="Prise en charge actuelle" icon={Wrench}>
        <SelectField
          label="Localisation actuelle de la machine"
          name="workshopStatus"
          value={form.workshopStatus}
          onChange={handleChange}
          options={WORKSHOP_OPTIONS}
          wide
        />
        {form.workshopStatus === 'IN_WORKSHOP' && (
          <>
            <Field
              label="Date de réception en atelier"
              name="workshopReceivedAt"
              value={form.workshopReceivedAt}
              onChange={handleChange}
              type="date"
            />
            <Field
              label="Date de restitution prévue"
              name="workshopReturnedAt"
              value={form.workshopReturnedAt}
              onChange={handleChange}
              type="date"
            />
            <TextareaField
              label="Observations à la réception"
              name="workshopNotes"
              value={form.workshopNotes}
              onChange={handleChange}
              placeholder="État général à l'arrivée, accessoires présents, remarques…"
              wide
            />
          </>
        )}
      </FormPanel>
    </>
  )
}

// ─── Étape 4 : Médias ───────────────────────────────────────────────────────

function DropZone({ onClick, icon: ZoneIcon, title, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-5 py-7 text-center transition hover:border-brand-500 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20"
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <ZoneIcon size={18} aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-ink">{title}</span>
      <span className="text-xs text-ink-muted text-pretty">{hint}</span>
    </button>
  )
}

function MediaStep({ imagePreviews, existingImages, imageInputRef, handleImageChange, clearImage, totalImages, totalDocs, existingDocs, docFiles, removeExistingDoc, removeNewDoc, docInputRef, handleDocChange, isEdit, traceability }) {
  return (
    <>
      <section className="overflow-hidden rounded-xl border border-line bg-white">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-slate-50/60 px-4 py-2.5 sm:px-5">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
            <ImageIcon size={13} aria-hidden="true" /> Photos
          </span>
          <span className="text-xs tabular-nums text-ink-faint">{totalImages} / 10</span>
        </header>
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          {totalImages > 0 && (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {existingImages.map((img, idx) => (
                <li key={img.publicId || idx} className="relative aspect-square overflow-hidden rounded-lg border border-line bg-slate-50">
                  <img src={img.url} alt={img.name || `Photo ${idx + 1}`} className="size-full object-cover" />
                  {idx === 0 && <span className="absolute bottom-1.5 left-1.5 rounded bg-ink/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">Couverture</span>}
                  <button type="button" onClick={() => clearImage(idx, 'existing')} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-md bg-white/95 text-red-600 shadow-card hover:bg-red-50" aria-label={`Retirer la photo ${idx + 1}`}>
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
              {imagePreviews.map((src, idx) => (
                <li key={`new-${idx}`} className="relative aspect-square overflow-hidden rounded-lg border-2 border-brand-300 bg-brand-50">
                  <img src={src} alt={`Nouvelle photo ${idx + 1}`} className="size-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Nouvelle</span>
                  <button type="button" onClick={() => clearImage(idx, 'new')} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-md bg-white/95 text-red-600 shadow-card hover:bg-red-50" aria-label={`Retirer`}>
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <DropZone onClick={() => imageInputRef.current?.click()} icon={Upload} title="Ajouter des photos" hint="JPG, PNG, WEBP · 5 Mo max · 10 images max" />
          <input ref={imageInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={handleImageChange} />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-white">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-slate-50/60 px-4 py-2.5 sm:px-5">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
            <FileText size={13} aria-hidden="true" /> Documents techniques
          </span>
          <span className="text-xs tabular-nums text-ink-faint">{totalDocs}</span>
        </header>
        <div className="flex flex-col gap-3 p-4 sm:p-5">
          {totalDocs > 0 && (
            <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
              {existingDocs.map((doc) => (
                <li key={doc.publicId} className="flex items-center gap-3 px-3 py-2.5">
                  <FileText size={14} className="shrink-0 text-brand-700" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{doc.name}</span>
                  <a href={doc.url} target="_blank" rel="noreferrer" className="shrink-0 text-xs text-brand-700 hover:underline">Voir</a>
                  <button type="button" onClick={() => removeExistingDoc(doc.publicId)} className="grid size-7 shrink-0 place-items-center rounded-md text-ink-faint hover:bg-red-50 hover:text-red-600" aria-label={`Retirer ${doc.name}`}>
                    <X size={13} aria-hidden="true" />
                  </button>
                </li>
              ))}
              {docFiles.map((f, i) => (
                <li key={`new-${i}`} className="flex items-center gap-3 border-brand-200 bg-brand-50/40 px-3 py-2.5">
                  <FileText size={14} className="shrink-0 text-brand-600" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{f.name}</span>
                  <span className="shrink-0 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">Nouveau</span>
                  <button type="button" onClick={() => removeNewDoc(i)} className="grid size-7 shrink-0 place-items-center rounded-md text-ink-faint hover:bg-red-50 hover:text-red-600" aria-label={`Retirer`}>
                    <X size={13} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <DropZone onClick={() => docInputRef.current?.click()} icon={FileText} title="Ajouter des documents" hint="Manuels, certificats, fiches techniques · PDF, Word, Excel" />
          <input ref={docInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={handleDocChange} />
        </div>
      </section>

      {isEdit && (
        <section className="overflow-hidden rounded-xl border border-line bg-white">
          <header className="flex items-center gap-2 border-b border-line bg-slate-50/60 px-4 py-2.5 sm:px-5">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">Traçabilité</span>
          </header>
          <dl className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0">
            {[
              ['Créé par', traceability.createdBy || '—'],
              ['Ajouté le', traceability.createdAt ? new Date(traceability.createdAt).toLocaleString('fr-FR') : '—'],
              ['Modifié par', traceability.updatedBy || '—'],
              ['Modifié le', traceability.updatedAt ? new Date(traceability.updatedAt).toLocaleString('fr-FR') : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                <dt className="text-xs text-ink-muted">{label}</dt>
                <dd className="truncate text-sm font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  )
}

// ─── Aperçu latéral ─────────────────────────────────────────────────────────

function LivePreview({ form, selectedClient, totalImages, totalDocs, cover }) {
  const filled = TRACKED_FIELDS.filter((k) => String(form[k] || '').trim() !== '').length
  const completion = Math.round(((filled + (selectedClient ? 1 : 0)) / (TRACKED_FIELDS.length + 1)) * 100)
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="relative aspect-[16/10] bg-slate-100">
        {cover
          ? <img src={cover} alt="" className="size-full object-cover" />
          : <span className="flex size-full items-center justify-center text-ink-faint"><Cpu size={28} aria-hidden="true" /></span>}
        <span className="absolute left-3 top-3 rounded-md bg-brand-600 px-2 py-1 font-mono text-[11px] font-bold tracking-wider text-white">Client</span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <p className={`text-sm font-semibold text-pretty ${form.designation ? 'text-ink' : 'text-ink-faint'}`}>
          {form.designation || 'Désignation à saisir'}
        </p>
        <p className="text-xs text-ink-muted">
          {[form.brand, form.model].filter(Boolean).join(' · ') || 'Marque · Modèle'}
        </p>
        {selectedClient && (
          <div className="flex items-center gap-2 rounded-lg bg-navy/5 px-3 py-2">
            <User size={13} className="shrink-0 text-navy" aria-hidden="true" />
            <span className="truncate text-xs font-semibold text-ink">{selectedClient.name}</span>
          </div>
        )}
        <dl className="flex flex-col divide-y divide-line border-y border-line text-xs">
          {[
            ['N° de série', form.serialNumber, true],
            ['Site client', form.clientSite],
            ['Localisation', form.workshopStatus === 'IN_WORKSHOP' ? 'En atelier SOMACS' : form.workshopStatus === 'AT_CLIENT_SITE' ? 'Sur site client' : '—'],
          ].map(([label, value, mono]) => (
            <div key={label} className="flex items-center justify-between gap-3 py-1.5">
              <dt className="text-ink-muted">{label}</dt>
              <dd className={`truncate font-medium ${value ? 'text-ink' : 'text-ink-faint'} ${mono && value ? 'font-mono' : ''}`}>{value || '—'}</dd>
            </div>
          ))}
        </dl>
        <p className="flex items-center gap-3 text-xs text-ink-muted">
          <span className="flex items-center gap-1"><ImageIcon size={12} aria-hidden="true" /> {totalImages} photo{totalImages > 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1"><FileText size={12} aria-hidden="true" /> {totalDocs} doc{totalDocs > 1 ? 's' : ''}</span>
        </p>
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink-soft">Complétude</span>
            <span className="font-semibold tabular-nums text-ink">{completion}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-full transition-all ${completion >= 75 ? 'bg-teal-600' : 'bg-brand-600'}`} style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function MachineClientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)

  // Préremplissage client depuis la fiche 360 ou le sélecteur de type
  const prefillClientId = searchParams.get('clientId')
  const prefillClientName = searchParams.get('clientName')

  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [activeStep, setActiveStep] = useState(1)
  const [duplicate, setDuplicate] = useState(false)
  const [traceability, setTraceability] = useState({})
  const [existingImages, setExistingImages] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [imagesToRemove, setImagesToRemove] = useState([])
  const [existingDocs, setExistingDocs] = useState([])
  const [docFiles, setDocFiles] = useState([])
  const [docsToRemove, setDocsToRemove] = useState([])
  const imageInputRef = useRef()
  const docInputRef = useRef()

  // Charger la machine en mode édition
  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    apiFetch(`/machines/${id}`, { auth: true })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const f = {}
        Object.keys(EMPTY_FORM).forEach((k) => { f[k] = data[k] ?? '' })
        setForm(f)
        setTraceability({ createdBy: data.createdBy, updatedBy: data.updatedBy, createdAt: data.createdAt, updatedAt: data.updatedAt })
        // Client
        if (data.clientId) {
          apiFetch(`/clients/${data.clientId}`, { auth: true })
            .then((r) => (r.ok ? r.json() : null))
            .then((c) => { if (c) setSelectedClient(c) })
            .catch(() => { /* non bloquant */ })
        }
        // Images
        if (data.imagesJson) {
          try { setExistingImages(JSON.parse(data.imagesJson)) } catch { /* skip */ }
        } else if (data.imageUrl) {
          setExistingImages([{ publicId: data.imagePublicId || null, url: data.imageUrl, name: 'Image machine' }])
        }
        // Documents
        if (data.documentsJson) {
          try { setExistingDocs(JSON.parse(data.documentsJson)) } catch { /* skip */ }
        }
      })
      .catch(() => setError('Impossible de charger la machine.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  // Préremplir le client depuis les query params (navigation depuis Client 360)
  useEffect(() => {
    if (!prefillClientId || isEdit) return
    apiFetch(`/clients/${prefillClientId}`, { auth: true })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => { if (c) setSelectedClient(c) })
      .catch(() => { /* non bloquant */ })
  }, [prefillClientId, isEdit])

  // Vérification doublon numéro de série
  useEffect(() => {
    if (!form.serialNumber?.trim() || !selectedClient?.id) {
      setDuplicate(false)
      return
    }
    const params = new URLSearchParams({
      serialNumber: form.serialNumber.trim(),
      clientId: String(selectedClient.id),
    })
    if (isEdit && id) params.set('excludeId', id)
    apiFetch(`/machines/check-duplicate?${params}`, { auth: true })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setDuplicate(Boolean(data?.duplicate)))
      .catch(() => setDuplicate(false))
  }, [form.serialNumber, selectedClient?.id, isEdit, id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (fieldErrors[name]) setFieldErrors((p) => { const n = { ...p }; delete n[name]; return n })
  }

  const handleClientSelect = (client) => {
    setSelectedClient(client)
    setFieldErrors((p) => { const n = { ...p }; delete n.clientId; return n })
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
      setExistingImages((prev) => prev.filter((_, i) => i !== index))
      setImagesToRemove((prev) => [...prev, img.publicId || `url:${img.url}`])
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

  const validate = () => {
    const errs = {}
    if (!selectedClient) errs.clientId = 'Sélectionnez le client propriétaire.'
    if (!form.designation.trim()) errs.designation = 'La désignation est obligatoire.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (activeStep < STEPS.length) return
    setError(null)
    if (!validate()) {
      setError('Champs obligatoires manquants.')
      setActiveStep(form.designation.trim() ? 1 : 2)
      return
    }
    setSaving(true)
    try {
      // Générer un code automatique si pas de code (non exposé dans le formulaire)
      const autoCode = isEdit
        ? undefined
        : `CLI-${selectedClient.id}-${Date.now().toString(36).toUpperCase()}`

      const fd = new FormData()
      fd.append('ownerType', 'CLIENT')
      if (!isEdit && autoCode) fd.append('code', autoCode)
      if (selectedClient?.id) fd.append('clientId', String(selectedClient.id))

      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'ownerType' && k !== 'code' && v !== '') fd.append(k, v)
      })

      imageFiles.forEach((f) => fd.append('images', f))
      docFiles.forEach((f) => fd.append('documents', f))
      if (docsToRemove.length) fd.append('removeDocuments', JSON.stringify(docsToRemove))
      if (imagesToRemove.length) fd.append('removeImages', JSON.stringify(imagesToRemove))

      const url = isEdit ? `/machines/${id}` : '/machines'
      const res = await apiFetch(url, { method: isEdit ? 'PATCH' : 'POST', body: fd, auth: true })
      if (!res.ok) {
        const r = await res.json().catch(() => ({}))
        throw new Error(Array.isArray(r.message) ? r.message.join(', ') : r.message || 'Erreur serveur')
      }
      const saved = await res.json()
      navigate(`/machines/${saved.id}`, {
        replace: true,
        state: { toast: { type: 'success', message: isEdit ? 'Machine mise à jour.' : 'Machine client enregistrée.' } },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const totalImages = existingImages.length + imageFiles.length
  const totalDocs = existingDocs.length + docFiles.length
  const stepHasError = (stepId) =>
    (stepId === 1 && Boolean(fieldErrors.clientId)) ||
    (stepId === 2 && Boolean(fieldErrors.designation))
  const backTo = isEdit ? `/machines/${id}` : '/machines'

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="size-8 animate-spin text-brand-600" aria-label="Chargement" />
      </div>
    )
  }

  const current = STEPS[activeStep - 1]

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-canvas">
      {/* Header sticky */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="ui-btn-ghost size-10 shrink-0 px-0"
            aria-label="Retour"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-ink-muted">
              Parc machines · {isEdit ? 'Modifier la fiche' : 'Nouvelle machine client'}
            </p>
            <h1 className="truncate font-display text-lg font-bold text-ink sm:text-xl">
              {isEdit
                ? (form.designation || 'Modifier la machine client')
                : selectedClient
                  ? `Machine client — ${selectedClient.name}`
                  : 'Enregistrer une machine client'}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="ui-btn-secondary hidden sm:inline-flex"
          >
            Annuler
          </button>
          <button
            form="machine-client-form"
            type="submit"
            disabled={saving}
            className="ui-btn-primary"
            onClick={() => activeStep < STEPS.length && setActiveStep(STEPS.length)}
          >
            {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            <span className="hidden sm:inline">{isEdit ? 'Enregistrer' : 'Créer la fiche'}</span>
          </button>
        </div>
        <div className="h-0.5 bg-slate-100" aria-hidden="true">
          <div
            className="h-full bg-brand-600 transition-all duration-300"
            style={{ width: `${(activeStep / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Grid */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_18rem]">
        {/* Nav étapes */}
        <nav aria-label="Étapes du formulaire" className="lg:sticky lg:top-24 lg:self-start">
          <ol className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:pb-0">
            {STEPS.map((step) => {
              const isActive = activeStep === step.id
              const isDone = activeStep > step.id
              const hasError = stepHasError(step.id)
              const StepIcon = step.icon
              return (
                <li key={step.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    aria-current={isActive ? 'step' : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${isActive ? 'bg-white shadow-card ring-1 ring-line' : 'hover:bg-white/70'}`}
                  >
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-bold ${hasError ? 'bg-red-600 text-white' : isActive ? 'bg-brand-600 text-white' : isDone ? 'bg-teal-600 text-white' : 'bg-slate-200 text-ink-muted'}`}>
                      {hasError ? <AlertCircle size={15} aria-hidden="true" /> : isDone ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : <StepIcon size={15} aria-hidden="true" />}
                    </span>
                    <span className="min-w-0">
                      <span className={`block whitespace-nowrap text-sm font-semibold ${isActive ? 'text-ink' : 'text-ink-soft'}`}>
                        {step.title}
                      </span>
                      <span className="hidden text-xs text-ink-faint lg:block">{step.description}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* Contenu principal */}
        <main className="flex min-w-0 flex-col gap-5">
          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-red-800 ring-1 ring-inset ring-red-200" role="alert">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold tabular-nums text-brand-700">Étape {activeStep} / {STEPS.length}</p>
            <h2 className="mt-0.5 font-display text-xl font-bold text-ink text-balance">{current.title}</h2>
          </div>

          <form id="machine-client-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {activeStep === 1 && (
              <ClientStep
                selectedClient={selectedClient}
                onSelect={handleClientSelect}
                fieldError={fieldErrors.clientId}
              />
            )}
            {activeStep === 2 && (
              <IdentificationStep
                form={form}
                handleChange={handleChange}
                fieldErrors={fieldErrors}
                duplicate={duplicate}
              />
            )}
            {activeStep === 3 && (
              <LocalisationStep
                form={form}
                handleChange={handleChange}
                selectedClient={selectedClient}
              />
            )}
            {activeStep === 4 && (
              <MediaStep
                imagePreviews={imagePreviews}
                existingImages={existingImages}
                imageInputRef={imageInputRef}
                handleImageChange={handleImageChange}
                clearImage={clearImage}
                totalImages={totalImages}
                totalDocs={totalDocs}
                existingDocs={existingDocs}
                docFiles={docFiles}
                removeExistingDoc={(pid) => {
                  setDocsToRemove((p) => [...p, pid])
                  setExistingDocs((p) => p.filter((d) => d.publicId !== pid))
                }}
                removeNewDoc={(i) => setDocFiles((p) => p.filter((_, idx) => idx !== i))}
                docInputRef={docInputRef}
                handleDocChange={handleDocChange}
                isEdit={isEdit}
                traceability={traceability}
              />
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
                disabled={activeStep === 1}
                className="ui-btn-secondary"
              >
                <ChevronLeft size={16} aria-hidden="true" /> Précédent
              </button>
              {activeStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={() => setActiveStep((s) => Math.min(STEPS.length, s + 1))}
                  className="ui-btn-primary"
                >
                  Continuer : {STEPS[activeStep].title}
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <button type="submit" disabled={saving} className="ui-btn-primary">
                  {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                  {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Créer la fiche machine'}
                </button>
              )}
            </div>
          </form>
        </main>

        {/* Aperçu latéral */}
        <aside className="hidden xl:sticky xl:top-24 xl:block xl:self-start" aria-label="Aperçu live">
          <LivePreview
            form={form}
            selectedClient={selectedClient}
            totalImages={totalImages}
            totalDocs={totalDocs}
            cover={existingImages[0]?.url || imagePreviews[0]}
          />
        </aside>
      </div>
    </div>
  )
}
