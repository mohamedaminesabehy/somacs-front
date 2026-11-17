/**
 * ClientMachineSelector — Sélecteur de Machine Client filtré par clientId.
 *
 * Affiche uniquement les Machines appartenant au Client sélectionné
 * (ownerType=CLIENT + clientId correspondant).
 * Permet aussi d'ajouter une nouvelle Machine Client à la volée.
 *
 * Usage dans CreateIntervention (étape 2) :
 *   <ClientMachineSelector
 *     clientId={formData.clientId}
 *     clientName={formData.clientName}
 *     selectedMachineId={formData.machineId}
 *     onSelect={handleMachineSelect}
 *     onAddNew={handleAddClientMachine}
 *   />
 */
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../api/apiClient'
import {
  AlertTriangle, Barcode, Cpu, Hash, Loader2, MapPin,
  Plus, RefreshCw, Tag, X,
} from 'lucide-react'

// ─── Création rapide d'une Machine Client ─────────────────────────────────

const EMPTY_NEW = {
  designation: '', brand: '', model: '', serialNumber: '',
  year: '', category: '', clientSite: '',
}

function AddMachineInline({ clientId, clientName, onCreated, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_NEW })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.designation.trim()) { setError('La désignation est obligatoire.'); return }
    setSaving(true)
    setError('')
    try {
      // Générer un code automatique
      const autoCode = `CLI-${clientId}-${Date.now().toString(36).toUpperCase()}`
      const fd = new FormData()
      fd.append('code', autoCode)
      fd.append('ownerType', 'CLIENT')
      fd.append('clientId', String(clientId))
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })

      const res = await apiFetch('/machines', { method: 'POST', body: fd, auth: true })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Erreur serveur')
        return
      }
      const created = await res.json()
      onCreated(created)
    } catch {
      setError('Impossible de créer la machine.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">
          Nouvelle machine — <span className="text-brand-700">{clientName}</span>
        </p>
        <button type="button" onClick={onCancel} className="rounded-md p-1 text-ink-faint hover:bg-white hover:text-ink">
          <X size={15} aria-hidden="true" />
        </button>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertTriangle size={13} aria-hidden="true" /> {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-ink-soft">
            Désignation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="designation"
            value={form.designation}
            onChange={handleChange}
            placeholder="Ex : Compresseur à vis 15 kW"
            className="ui-input w-full"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Marque</label>
          <input type="text" name="brand" value={form.brand} onChange={handleChange} placeholder="Atlas Copco" className="ui-input w-full" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Modèle</label>
          <input type="text" name="model" value={form.model} onChange={handleChange} placeholder="GA 15" className="ui-input w-full" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">N° de série</label>
          <input type="text" name="serialNumber" value={form.serialNumber} onChange={handleChange} placeholder="SN-XXXXXXX" className="ui-input w-full font-mono" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Site client habituel</label>
          <input type="text" name="clientSite" value={form.clientSite} onChange={handleChange} placeholder="Atelier, rue…" className="ui-input w-full" />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="ui-btn-secondary">
          Annuler
        </button>
        <button type="submit" disabled={saving} className="ui-btn-primary">
          {saving ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
          {saving ? 'Enregistrement…' : 'Créer et sélectionner'}
        </button>
      </div>
    </form>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────

export default function ClientMachineSelector({
  clientId,
  clientName,
  selectedMachineId,
  onSelect,
  error: propError,
  onRequestAddMachine, // Nouveau callback pour demander l'ouverture de la modal
}) {
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [query, setQuery] = useState('')
  const [hasCheckedEmpty, setHasCheckedEmpty] = useState(false)

  const load = useCallback(async () => {
    if (!clientId) { setMachines([]); return }
    setLoading(true)
    setFetchError('')
    setHasCheckedEmpty(false)
    try {
      const res = await apiFetch(`/machines/by-client/${clientId}`, { auth: true })
      if (!res.ok) { setFetchError('Impossible de charger les machines.'); return }
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setMachines(list)
      
      // Si aucune machine et callback fourni, ouvrir automatiquement la modal
      if (list.length === 0 && onRequestAddMachine && !hasCheckedEmpty) {
        setHasCheckedEmpty(true)
        onRequestAddMachine()
      }
    } catch {
      setFetchError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }, [clientId, onRequestAddMachine, hasCheckedEmpty])

  useEffect(() => {
    setQuery('')
    load()
  }, [load])

  const filtered = query.trim()
    ? machines.filter((m) => {
        const q = query.toLowerCase()
        return [m.designation, m.code, m.brand, m.serialNumber, m.model]
          .some((v) => String(v || '').toLowerCase().includes(q))
      })
    : machines

  const selectedMachine = machines.find((m) => String(m.id) === String(selectedMachineId))

  const handleCreated = (machine) => {
    setMachines((prev) => [machine, ...prev])
    setShowAddForm(false)
    onSelect(machine)
  }

  // ── Pas de client sélectionné ───────────────────────────────────────────
  if (!clientId) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-ink-faint">
          <Cpu size={22} aria-hidden="true" />
        </span>
        <p className="text-sm font-medium text-ink-muted">
          Sélectionnez d&apos;abord un client pour afficher ses machines.
        </p>
      </div>
    )
  }

  // ── Machine déjà sélectionnée ───────────────────────────────────────────
  if (selectedMachineId && selectedMachine) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-navy text-white shadow-raised">
        <div className="ui-blueprint pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="relative flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/20">
            <Cpu size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-200">Machine client</p>
            <p className="mt-0.5 truncate font-display text-base font-bold">{selectedMachine.designation}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-100/80">
              {selectedMachine.serialNumber && (
                <span className="inline-flex items-center gap-1 font-mono">
                  <Barcode size={11} aria-hidden="true" /> {selectedMachine.serialNumber}
                </span>
              )}
              {selectedMachine.brand && (
                <span className="inline-flex items-center gap-1">
                  <Tag size={11} aria-hidden="true" /> {[selectedMachine.brand, selectedMachine.model].filter(Boolean).join(' · ')}
                </span>
              )}
              {selectedMachine.clientSite && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} aria-hidden="true" /> {selectedMachine.clientSite}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-navy transition-colors hover:bg-brand-50"
          >
            <RefreshCw size={14} aria-hidden="true" /> Changer
          </button>
        </div>
      </div>
    )
  }

  // ── Sélection de machine ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {propError && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertTriangle size={13} aria-hidden="true" /> {propError}
        </p>
      )}

      {fetchError && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertTriangle size={13} aria-hidden="true" /> {fetchError}
          <button type="button" onClick={load} className="underline">Réessayer</button>
        </p>
      )}

      {!showAddForm && (
        <>
          {machines.length > 4 && (
            <div className="relative">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher parmi les machines du client…"
                className="ui-input pl-10 w-full"
              />
              <Hash size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-brand-600" aria-label="Chargement…" />
            </div>
          )}

          {!loading && !fetchError && machines.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center">
              <Cpu size={22} className="text-ink-faint" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">Aucune machine enregistrée pour ce client</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Ajoutez une machine client pour l&apos;associer à cette intervention.
                </p>
              </div>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(m)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
                      <Cpu size={16} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{m.designation}</span>
                      <span className="block text-xs text-ink-muted">
                        {m.serialNumber ? <span className="font-mono">{m.serialNumber}</span> : null}
                        {m.serialNumber && (m.brand || m.model) ? ' · ' : null}
                        {[m.brand, m.model].filter(Boolean).join(' ')}
                      </span>
                    </span>
                    {m.clientSite && (
                      <span className="shrink-0 text-xs text-ink-faint">
                        {m.clientSite}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {showAddForm ? (
        <AddMachineInline
          clientId={clientId}
          clientName={clientName}
          onCreated={handleCreated}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            if (onRequestAddMachine) {
              onRequestAddMachine()
            } else {
              setShowAddForm(true)
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/40 px-4 py-3 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
        >
          <Plus size={16} aria-hidden="true" />
          Ajouter une machine client pour {clientName || 'ce client'}
        </button>
      )}
    </div>
  )
}
