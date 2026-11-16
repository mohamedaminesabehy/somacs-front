import { useMemo, useState } from 'react'
import {
  AlertCircle, ArrowRight, Building2, Calendar, Check, ClipboardList, Clock, FileText, Hourglass,
  Link2, MapPin, Paperclip, Phone, Search, Truck, UserCheck, Users, Wrench, X,
} from 'lucide-react'
import { INTERVENTION_STATUS_BADGE as statusColors } from '../../../utils/intervention'
import { FormField } from '../../intervention/components/interventionUi'
import { MAX_TECHNICIANS, PRIORITIES } from './assignConstants'


export function StepHeading({ eyebrow, title, description }) {
  return (
    <header className="flex flex-col gap-1.5 border-b border-line pb-5">
      <p className="ui-eyebrow">{eyebrow}</p>
      <h2 className="font-display text-xl font-bold tracking-tight text-ink text-balance sm:text-2xl">{title}</h2>
      {description && <p className="max-w-2xl text-sm leading-relaxed text-ink-muted text-pretty">{description}</p>}
    </header>
  )
}

function SectionLabel({ icon: Icon, children, aside }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
        {Icon && <Icon size={13} className="text-brand-600" aria-hidden="true" />}
        {children}
      </p>
      {aside}
    </div>
  )
}

function SelectedTick() {
  return (
    <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-brand-600 text-white" aria-hidden="true">
      <Check size={12} strokeWidth={3} />
    </span>
  )
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

/* ---------------------------------------------------------------- Step 1 */

const MISSION_TYPES = [
  {
    value: 'Normal',
    icon: ClipboardList,
    title: 'Mission normale',
    description: 'Tâche libre affectée directement à un ou plusieurs techniciens.',
    examples: ['Maintenance préventive', 'Inventaire', 'Formation', 'Rapport'],
    flow: ['Rédaction de la tâche', 'Affectation', 'Suivi terrain'],
  },
  {
    value: 'Intervention',
    icon: Wrench,
    title: 'Intervention SAV',
    description: 'Rattachée à un dossier client en attente, qui passe automatiquement au statut « Affectée ».',
    examples: ['Réparation', 'Garantie', 'Installation', 'Dépannage'],
    flow: ['Choix du dossier', 'Affectation', 'Dossier « Affectée »'],
  },
]

export function StepType({ missionType, setMissionType, showErrors }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        eyebrow="Étape 1 · Nature"
        title="Quel type de mission affectez-vous ?"
        description="Le type détermine les informations demandées ensuite et l’impact sur les dossiers d’intervention."
      />
      <div role="radiogroup" aria-label="Type de mission" className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {MISSION_TYPES.map((type) => {
          const active = missionType === type.value
          const Icon = type.icon
          return (
            <button
              key={type.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMissionType(type.value)}
              className={`relative flex flex-col gap-5 rounded-2xl border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:p-6
                ${active ? 'border-brand-600 bg-brand-50/50 shadow-lift' : 'border-line bg-white hover:border-brand-200 hover:shadow-card'}`}
            >
              {active && <SelectedTick />}
              <div className="flex items-start gap-4">
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand-600 text-white' : 'bg-navy text-white'}`}>
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="min-w-0 pr-6">
                  <span className="block font-display text-lg font-bold text-ink">{type.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-muted">{type.description}</span>
                </span>
              </div>

              <ol className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white/70 px-3 py-2.5" aria-label="Déroulement">
                {type.flow.map((label, i) => (
                  <li key={label} className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                    {i > 0 && <ArrowRight size={12} className="text-ink-faint" aria-hidden="true" />}
                    <span className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-muted'}`}>{i + 1}</span>
                    {label}
                  </li>
                ))}
              </ol>

              <div className="flex flex-wrap gap-1.5">
                {type.examples.map((tag) => (
                  <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-ink-muted">{tag}</span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
      {showErrors && !missionType && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-red-600" role="alert">
          <AlertCircle size={14} aria-hidden="true" /> Sélectionnez un type de mission pour continuer.
        </p>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- Step 2 */

function DossierPicker({ interventions, value, onSelect, error }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return interventions
    return interventions.filter((i) => [i.id, i.client, i.machine, i.site].some((v) => String(v || '').toLowerCase().includes(q)))
  }, [interventions, query])

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel icon={Link2} aside={<span className="text-xs font-medium tabular-nums text-ink-faint">{interventions.length} en attente</span>}>
        Dossier d’intervention à lier<span className="text-red-600" aria-hidden="true">*</span>
      </SectionLabel>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par n° de dossier, client, équipement…"
          aria-label="Rechercher un dossier"
          className="ui-input pl-10"
        />
      </div>
      <div
        role="radiogroup"
        aria-label="Dossiers en attente"
        className={`flex max-h-80 flex-col divide-y divide-line overflow-y-auto rounded-xl border bg-white ${error ? 'border-red-300' : 'border-line'}`}
      >
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-muted">
            {interventions.length === 0 ? 'Aucun dossier en attente d’affectation.' : 'Aucun dossier ne correspond à cette recherche.'}
          </p>
        ) : filtered.map((inv) => {
          const active = value === inv.id
          return (
            <button
              key={inv.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(inv.id)}
              className={`flex items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:bg-brand-50 ${active ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
            >
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'}`} aria-hidden="true">
                {active && <Check size={11} strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-mono text-xs font-bold text-brand-700">{inv.id}</span>
                  <span className="truncate text-sm font-semibold text-ink">{inv.client}</span>
                </span>
                <span className="block truncate text-xs text-ink-muted">{inv.machine}{inv.site ? ` · ${inv.site}` : ''}</span>
              </span>
              <span className="hidden shrink-0 text-xs tabular-nums text-ink-faint sm:block">{inv.date}</span>
            </button>
          )
        })}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600" role="alert">
          <AlertCircle size={12} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  )
}

function DossierSummary({ intervention }) {
  const rows = [
    { icon: Building2, label: 'Client', value: intervention.client, sub: intervention.clientCode },
    { icon: Wrench, label: 'Équipement', value: intervention.machine },
    { icon: Phone, label: 'Téléphone', value: intervention.phone },
    { icon: MapPin, label: 'Site', value: intervention.site, sub: intervention.address },
    { icon: Calendar, label: 'Ouvert le', value: intervention.date },
  ]
  return (
    <section aria-label="Dossier sélectionné" className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-slate-50/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="ui-ref">{intervention.id}</span>
          {intervention.type && <span className="text-xs font-medium text-ink-muted">{intervention.type}</span>}
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${statusColors[intervention.status] || ''}`}>
          {intervention.status === 'PENDING' && <Hourglass size={12} aria-hidden="true" />}
          {intervention.status === 'ASSIGNED' && <UserCheck size={12} aria-hidden="true" />}
          {intervention.statusLabel}
        </span>
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 sm:grid-cols-2">
        {rows.map(({ icon: RowIcon, label, value, sub }) => (
          <div key={label} className="flex min-w-0 items-start gap-2.5">
            <RowIcon size={15} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</dt>
              <dd className="break-words text-sm font-medium text-ink">{value || '—'}</dd>
              {sub && <dd className="break-words text-xs text-ink-muted">{sub}</dd>}
            </div>
          </div>
        ))}
        {intervention.request && (
          <div className="sm:col-span-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Demande du client</dt>
            <dd className="mt-1 rounded-lg border-l-2 border-brand-600 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-ink-soft">{intervention.request}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}

function AttachmentsField({ attachments, fileInputRef, handlePickFiles, openFilePicker, removeAttachment }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel icon={Paperclip} aside={<span className="text-xs tabular-nums text-ink-faint">{attachments.length}/10</span>}>
        Pièces jointes
      </SectionLabel>
      <input type="file" multiple accept="application/pdf,image/*" className="sr-only" id="mission-attachments" onChange={handlePickFiles} ref={fileInputRef} />
      <button
        type="button"
        onClick={openFilePicker}
        className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-4 text-left transition-colors hover:border-brand-600 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 ring-1 ring-inset ring-line">
          <Paperclip size={18} aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink">Ajouter des documents</span>
          <span className="block text-xs text-ink-muted">PDF, JPG ou PNG · 10 Mo maximum par fichier</span>
        </span>
      </button>
      {attachments.length > 0 && (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {attachments.map((file) => (
            <li key={`${file.name}_${file.size}_${file.lastModified}`} className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2">
              <FileText size={16} className="shrink-0 text-brand-700" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-ink">{file.name}</span>
                <span className="block text-[11px] tabular-nums text-ink-faint">{Math.ceil(file.size / 1024)} Ko</span>
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(file)}
                className="grid size-7 place-items-center rounded-md text-ink-faint hover:bg-red-50 hover:text-red-600"
                aria-label={`Retirer ${file.name}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function StepDetails({ form, showErrors }) {
  const { missionType, formData, handleChange, linkableInterventions, selectedIntervention } = form
  const isSav = missionType === 'Intervention'
  const errors = showErrors ? {
    interventionId: isSav && !formData.interventionId ? 'Sélectionnez le dossier à lier.' : '',
    title: !formData.title.trim() ? 'Le titre est obligatoire.' : '',
    description: !isSav && !formData.description.trim() ? 'Décrivez les actions à réaliser.' : '',
  } : {}

  return (
    <div className="flex flex-col gap-7">
      <StepHeading
        eyebrow={`Étape 2 · ${isSav ? 'Intervention SAV' : 'Mission normale'}`}
        title={isSav ? 'Dossier et consignes' : 'Contenu de la mission'}
        description={isSav
          ? 'Choisissez le dossier client en attente, puis précisez la tâche confiée au technicien.'
          : 'Décrivez la tâche, le lieu et joignez les documents utiles au technicien.'}
      />

      {isSav && (
        <div className="flex flex-col gap-4">
          <DossierPicker
            interventions={linkableInterventions}
            value={formData.interventionId}
            onSelect={(id) => handleChange({ target: { name: 'interventionId', value: id } })}
            error={errors.interventionId}
          />
          {selectedIntervention && <DossierSummary intervention={selectedIntervention} />}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label={isSav ? 'Titre de la sous-mission' : 'Titre de la mission'} htmlFor="mission-title" required full error={errors.title} icon={ClipboardList}>
          <input
            id="mission-title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={isSav ? 'Ex. Remplacement du vérin hydraulique' : 'Ex. Maintenance préventive du groupe électrogène'}
            aria-invalid={Boolean(errors.title)}
            className={`ui-input pl-10 ${errors.title ? 'border-red-300' : ''}`}
          />
        </FormField>
        <FormField
          label="Instructions techniques"
          htmlFor="mission-description"
          required={!isSav}
          full
          error={errors.description}
          hint="Actions à réaliser, outillage nécessaire, consignes de sécurité."
          counter={`${formData.description.length} car.`}
        >
          <textarea
            id="mission-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Décrivez précisément l’intervention attendue…"
            aria-invalid={Boolean(errors.description)}
            className={`ui-textarea ${errors.description ? 'border-red-300' : ''}`}
          />
        </FormField>
        <FormField label="Site" htmlFor="mission-site" icon={Building2} hint={isSav ? 'Prérempli depuis le dossier, modifiable.' : undefined}>
          <input id="mission-site" type="text" name="site" value={formData.site} onChange={handleChange} placeholder="Nom du site ou du client" className="ui-input pl-10" />
        </FormField>
        <FormField label="Adresse" htmlFor="mission-address" icon={MapPin}>
          <input id="mission-address" type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Adresse complète" className="ui-input pl-10" />
        </FormField>
      </div>

      <AttachmentsField {...form} />
    </div>
  )
}

/* ---------------------------------------------------------------- Step 3 */

function workload(active = 0) {
  if (active === 0) return { label: 'Disponible', tone: 'text-teal-700', bar: 'bg-teal-500' }
  if (active <= 1) return { label: `${active} mission active`, tone: 'text-amber-700', bar: 'bg-amber-500' }
  return { label: `${active} missions actives`, tone: 'text-red-700', bar: 'bg-red-500' }
}

function TechnicianRoster({ technicians, selected, onToggle, error }) {
  const [query, setQuery] = useState('')
  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...technicians]
      .filter((t) => !q || t.name.toLowerCase().includes(q))
      .sort((a, b) => (a.active || 0) - (b.active || 0))
  }, [technicians, query])
  const full = selected.length >= MAX_TECHNICIANS

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel
        icon={Users}
        aside={
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${full ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-ink-muted'}`}>
            {selected.length}/{MAX_TECHNICIANS} sélectionné{selected.length > 1 ? 's' : ''}
          </span>
        }
      >
        Techniciens<span className="text-red-600" aria-hidden="true">*</span>
      </SectionLabel>
      {technicians.length > 6 && (
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un technicien" aria-label="Rechercher un technicien" className="ui-input pl-10" />
        </div>
      )}
      <ul className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${error ? 'rounded-xl ring-1 ring-red-300 ring-offset-4' : ''}`}>
        {sorted.length === 0 && (
          <li className="rounded-xl border border-line px-4 py-6 text-center text-sm text-ink-muted sm:col-span-2">Aucun technicien trouvé.</li>
        )}
        {sorted.map((emp) => {
          const isSelected = selected.includes(emp.name)
          const load = workload(emp.active)
          const blocked = full && !isSelected
          return (
            <li key={emp.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(emp.name)}
                className={`relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15
                  ${isSelected ? 'border-brand-600 bg-brand-50/60' : 'border-line bg-white hover:border-brand-200'} ${blocked ? 'opacity-60' : ''}`}
              >
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-soft'}`}>
                  {isSelected ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : (emp.avatar || initials(emp.name))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{emp.name}</span>
                  <span className={`block text-xs font-medium ${load.tone}`}>{load.label}</span>
                </span>
                <span className="flex shrink-0 gap-0.5" aria-hidden="true" title="Charge actuelle">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`h-5 w-1.5 rounded-sm ${i < Math.min(emp.active || 0, 3) ? load.bar : 'bg-slate-200'}`} />
                  ))}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600" role="alert">
          <AlertCircle size={12} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  )
}

function PriorityPicker({ value, onChange }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel icon={AlertCircle}>Priorité</SectionLabel>
      <div role="radiogroup" aria-label="Priorité" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRIORITIES.map((p) => {
          const active = value === p.key
          return (
            <button
              key={p.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(p.key)}
              className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 ${active ? p.active : 'border-line bg-white text-ink hover:border-slate-300'}`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className={`size-2 rounded-full ${p.dot}`} aria-hidden="true" /> {p.key}
              </span>
              <span className={`text-[11px] ${active ? 'opacity-80' : 'text-ink-faint'}`}>{p.hint}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function VehiclePicker({ vehicles, loading, value, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel icon={Truck} aside={<span className="text-xs text-ink-faint">Optionnel</span>}>Véhicule de service</SectionLabel>
      {disabled && (
        <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
          <AlertCircle size={13} className="shrink-0" aria-hidden="true" /> Le véhicule n’est pas disponible pour une affectation à plusieurs techniciens.
        </p>
      )}
      {loading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[0, 1].map((i) => <div key={i} className="ui-skeleton h-16 rounded-xl" />)}
        </div>
      ) : vehicles.length === 0 ? (
        <p className="rounded-xl border border-line bg-slate-50 px-4 py-4 text-sm text-ink-muted">Aucun véhicule disponible actuellement.</p>
      ) : (
        <div role="radiogroup" aria-label="Véhicule" className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
          {[{ id: '', matricule: 'Sans véhicule', marque: 'Déplacement par', modele: 'autre moyen' }, ...vehicles].map((v) => {
            const active = String(value) === String(v.id)
            return (
              <button
                key={v.id || 'none'}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => onChange(String(v.id))}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 ${active ? 'border-brand-600 bg-brand-50/60' : 'border-line bg-white hover:border-brand-200'}`}
              >
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-muted'}`}>
                  {v.id ? <Truck size={16} aria-hidden="true" /> : <X size={16} aria-hidden="true" />}
                </span>
                <span className="min-w-0">
                  <span className={`block truncate text-sm font-semibold text-ink ${v.id ? 'font-mono tracking-wide' : ''}`}>{v.matricule}</span>
                  <span className="block truncate text-xs text-ink-muted">{v.marque} {v.modele}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
      {value && !disabled && (
        <p className="text-xs text-ink-muted">Le véhicule passera au statut « Affecté » après confirmation.</p>
      )}
    </div>
  )
}

export function StepAssignment({ form, technicians, vehicles, vehiclesLoading, showErrors }) {
  const { selectedEmployees, selectedEmployeeObjs, toggleEmployeeSelection, priority, setPriority, dueDate, setDueDate, dueTime, setDueTime, vehicleId, setVehicleId, driverUserId, setDriverUserId } = form
  const needsDriverChoice = Boolean(vehicleId) && selectedEmployeeObjs.length > 1
  const errors = showErrors ? {
    employees: selectedEmployees.length === 0 ? 'Sélectionnez au moins un technicien.' : '',
    dueDate: !dueDate ? 'La date de mission est obligatoire.' : '',
    driver: needsDriverChoice && !driverUserId ? 'Désignez le chauffeur du véhicule.' : '',
  } : {}

  return (
    <div className="flex flex-col gap-7">
      <StepHeading
        eyebrow="Étape 3 · Affectation"
        title="Équipe, planning et moyens"
        description="Les techniciens sont classés du plus disponible au plus chargé. Trois techniciens au maximum par mission."
      />
      <TechnicianRoster technicians={technicians} selected={selectedEmployees} onToggle={toggleEmployeeSelection} error={errors.employees} />
      <PriorityPicker value={priority} onChange={setPriority} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Date de mission" htmlFor="mission-date" required error={errors.dueDate} icon={Calendar}>
          <input id="mission-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-invalid={Boolean(errors.dueDate)} className={`ui-input pl-10 ${errors.dueDate ? 'border-red-300' : ''}`} />
        </FormField>
        <FormField label="Heure de début" htmlFor="mission-time" icon={Clock} hint="Optionnelle.">
          <input id="mission-time" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="ui-input pl-10" />
        </FormField>
      </div>
      <VehiclePicker vehicles={vehicles} loading={vehiclesLoading} value={vehicleId} onChange={setVehicleId} disabled={false} />
      {needsDriverChoice && (
        <DriverPicker team={selectedEmployeeObjs} value={driverUserId} onChange={setDriverUserId} error={errors.driver} />
      )}
    </div>
  )
}

function DriverPicker({ team, value, onChange, error }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel icon={Truck}>Chauffeur du véhicule</SectionLabel>
      <p className="text-xs text-ink-muted">Le chauffeur saisit le kilométrage et restitue le véhicule. Les autres membres l’utilisent comme passagers.</p>
      <div role="radiogroup" aria-label="Chauffeur du véhicule" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {team.map((member) => {
          const active = String(value) === String(member.id)
          return (
            <button
              key={member.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(String(member.id))}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 ${active ? 'border-brand-600 bg-brand-50/60 text-ink' : 'border-line bg-white text-ink hover:border-brand-200'}`}
            >
              <span className={`size-2 shrink-0 rounded-full ${active ? 'bg-brand-600' : 'bg-slate-300'}`} aria-hidden="true" />
              <span className="truncate">{member.name}</span>
            </button>
          )
        })}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600" role="alert">
          <AlertCircle size={12} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- Step 4 */

function RecapBlock({ title, onEdit, children }) {
  return (
    <section className="flex flex-col gap-3 px-5 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">{title}</h3>
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-xs font-semibold text-brand-700 hover:underline">Modifier</button>
        )}
      </div>
      {children}
    </section>
  )
}

function RecapRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-ink">{children}</dd>
    </div>
  )
}

export function StepReview({ form, vehicles, goToStep }) {
  const { missionType, formData, selectedIntervention, selectedEmployeeObjs, selectedEmployees, priority, dueDate, dueTime, vehicleId, attachments } = form
  const isSav = missionType === 'Intervention'
  const vehicle = vehicles.find((v) => String(v.id) === String(vehicleId))
  const prio = PRIORITIES.find((p) => p.key === priority)
  const dateLabel = dueDate
    ? new Date(`${dueDate}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        eyebrow="Étape 4 · Validation"
        title="Ordre de mission"
        description="Relisez l’ordre de mission avant de l’envoyer. Il sera visible immédiatement dans l’espace des techniciens."
      />

      <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <header className="flex flex-wrap items-center justify-between gap-3 bg-navy px-5 py-4 text-white sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">{isSav ? 'Intervention SAV' : 'Mission normale'}</p>
            <p className="truncate font-display text-lg font-bold">{formData.title || 'Sans titre'}</p>
          </div>
          {prio && (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              <span className={`size-2 rounded-full ${prio.dot}`} aria-hidden="true" /> Priorité {prio.key.toLowerCase()}
            </span>
          )}
        </header>

        <div className="divide-y divide-line">
          <RecapBlock title="Contenu" onEdit={() => goToStep(2)}>
            <dl className="flex flex-col gap-2.5">
              {isSav && selectedIntervention && (
                <RecapRow label="Dossier lié">
                  <span className="font-mono text-xs font-bold text-brand-700">{selectedIntervention.id}</span>
                  <span className="text-ink-muted"> · {selectedIntervention.client} · {selectedIntervention.machine}</span>
                </RecapRow>
              )}
              <RecapRow label="Instructions">
                {formData.description ? <span className="whitespace-pre-line font-normal text-ink-soft">{formData.description}</span> : <span className="italic text-ink-faint">Aucune</span>}
              </RecapRow>
              <RecapRow label="Lieu">
                {[formData.site, formData.address].filter(Boolean).join(' · ') || <span className="italic text-ink-faint">Non renseigné</span>}
              </RecapRow>
              {attachments.length > 0 && (
                <RecapRow label="Pièces jointes">{attachments.length} document{attachments.length > 1 ? 's' : ''}</RecapRow>
              )}
            </dl>
          </RecapBlock>

          <RecapBlock title="Équipe" onEdit={() => goToStep(3)}>
            <ul className="flex flex-wrap gap-2">
              {selectedEmployeeObjs.map((emp) => (
                <li key={emp.id} className="flex items-center gap-2 rounded-full border border-line bg-slate-50 py-1 pl-1 pr-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{emp.avatar || initials(emp.name)}</span>
                  <span className="text-sm font-semibold text-ink">{emp.name}</span>
                </li>
              ))}
            </ul>
          </RecapBlock>

          <RecapBlock title="Planning et moyens" onEdit={() => goToStep(3)}>
            <dl className="flex flex-col gap-2.5">
              <RecapRow label="Date"><span className="first-letter:uppercase">{dateLabel}</span>{dueTime ? ` à ${dueTime}` : ''}</RecapRow>
              <RecapRow label="Véhicule">
                {vehicle ? <><span className="font-mono">{vehicle.matricule}</span> · {vehicle.marque} {vehicle.modele}</> : <span className="italic text-ink-faint">Aucun</span>}
                {vehicle && form.driverUserId && (
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    Chauffeur : {selectedEmployeeObjs.find((e) => String(e.id) === String(form.driverUserId))?.name || '—'}
                  </span>
                )}
              </RecapRow>
            </dl>
          </RecapBlock>
        </div>
      </article>

      {isSav && selectedIntervention && (
        <p className="flex items-start gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-900 ring-1 ring-inset ring-brand-100">
          <Link2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Le dossier <strong className="font-mono">{selectedIntervention.id}</strong> passera au statut « Affectée » et sera attribué à{' '}
            <strong>{selectedEmployees.join(', ')}</strong>.
          </span>
        </p>
      )}
    </div>
  )
}
