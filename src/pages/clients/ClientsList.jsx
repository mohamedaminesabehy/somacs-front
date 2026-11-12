import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Map,
} from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import { EmptyState, InlineAlert, SkeletonTableRows } from '../../components/ui/Feedback'
import { StatStrip, SearchField, SegmentedFilter, Toolbar, Toast } from '../../components/ui/DataKit'

const PAGE_SIZE = 10

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getInitials(name) {
  return (
    String(name || '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || '?'
  )
}

const isIncomplete = (client) => !client.phone && !client.email

function readRole() {
  try {
    const user = JSON.parse(window.localStorage.getItem('auth_user') || 'null')
    return String(user?.role || '').trim().toLowerCase()
  } catch {
    return ''
  }
}

function ClientAvatar({ client }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy font-display text-sm font-bold text-white">
      {getInitials(client.name)}
    </span>
  )
}

function ContactLine({ icon, value, fallback }) {
  const Icon = icon
  return (
    <span className={`flex min-w-0 items-center gap-2 ${value ? 'text-ink-soft' : 'text-ink-faint'}`}>
      <Icon size={14} className="shrink-0" aria-hidden="true" />
      <span className="truncate">{value || fallback}</span>
    </span>
  )
}

function CompletenessBadge({ client }) {
  return isIncomplete(client) ? (
    <StatusBadge tone="amber">À compléter</StatusBadge>
  ) : (
    <StatusBadge tone="teal">Complet</StatusBadge>
  )
}

export default function ClientsList() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [completeness, setCompleteness] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  const role = readRole()
  const canDelete = ['administrateur', 'coordinateur', 'responsable technicien'].includes(role)

  const loadClients = useCallback(() => {
    let alive = true
    setLoading(true)
    setError(null)
    apiFetch('/clients')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => alive && setClients(Array.isArray(data) ? data : []))
      .catch((err) => alive && setError(err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => loadClients(), [loadClients])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const types = useMemo(() => [...new Set(clients.map((c) => c.type).filter(Boolean))].sort(), [clients])
  const zones = useMemo(() => [...new Set(clients.map((c) => c.zone || c.city).filter(Boolean))].sort(), [clients])

  const counts = useMemo(() => {
    const incomplete = clients.filter(isIncomplete).length
    return {
      total: clients.length,
      complete: clients.length - incomplete,
      incomplete,
      withEmail: clients.filter((c) => c.email).length,
    }
  }, [clients])

  const filtered = useMemo(() => {
    const q = normalize(search.trim())
    return clients.filter((c) => {
      if (completeness === 'complete' && isIncomplete(c)) return false
      if (completeness === 'incomplete' && !isIncomplete(c)) return false
      if (typeFilter !== 'all' && c.type !== typeFilter) return false
      if (zoneFilter !== 'all' && (c.zone || c.city) !== zoneFilter) return false
      if (!q) return true
      return [c.code, c.name, c.phone, c.phone2, c.email, c.city, c.zone, c.address].map(normalize).join(' ').includes(q)
    })
  }, [clients, search, completeness, typeFilter, zoneFilter])

  useEffect(() => {
    setPage(1)
  }, [search, completeness, typeFilter, zoneFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const hasFilters = Boolean(search || completeness || typeFilter !== 'all' || zoneFilter !== 'all')

  const resetFilters = () => {
    setSearch('')
    setCompleteness(null)
    setTypeFilter('all')
    setZoneFilter('all')
  }

  const goTo360 = (client) => navigate(`/clients/${client.id}/360`)

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      const response = await apiFetch(`/clients/${deleteTarget.id}`, { method: 'DELETE', auth: true })
      if (response.ok) {
        setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id))
        setToast({ type: 'success', message: `Le client « ${deleteTarget.name} » a été supprimé.` })
      } else {
        const data = await response.json().catch(() => ({}))
        setToast({ type: 'error', message: data.message || 'Erreur lors de la suppression.' })
      }
    } catch {
      setToast({ type: 'error', message: 'Impossible de supprimer le client. Vérifiez votre connexion.' })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const statItems = [
    { key: 'complete', label: 'Fiches complètes', value: counts.complete, icon: CheckCircle2, tone: 'teal' },
    { key: 'incomplete', label: 'À compléter', value: counts.incomplete, icon: AlertTriangle, tone: 'amber', hint: 'Sans téléphone ni email' },
  ]

  const typeOptions = [
    { value: 'all', label: 'Tous', count: clients.length },
    ...types.map((type) => ({ value: type, label: type, count: clients.filter((c) => c.type === type).length })),
  ]

  return (
    <div className="ui-page">
      <PageHeader
        eyebrow="Référentiel"
        title="Clients"
        description="Annuaire des établissements suivis par SOMACS. Ouvrez la fiche 360° pour voir parc, missions et interventions."
        icon={Building2}
        meta={!loading && `${counts.total} client(s) · ${zones.length} zone(s)`}
        actions={
          <button type="button" onClick={loadClients} disabled={loading} className="ui-btn-secondary">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            Actualiser
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div className="ui-card flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-white">
            <Building2 size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink-muted">Clients enregistrés</p>
            <p className="font-display text-3xl font-bold tabular-nums text-ink">{loading ? '…' : counts.total}</p>
            <p className="text-xs text-ink-faint">{counts.withEmail} joignable(s) par email</p>
          </div>
        </div>
        <StatStrip
          items={statItems}
          total={counts.total}
          activeKey={completeness}
          onSelect={setCompleteness}
        />
      </div>

      <Toolbar
        summary={loading ? 'Chargement…' : `${filtered.length} client(s) affiché(s) sur ${clients.length}`}
        onReset={hasFilters ? resetFilters : undefined}
      >
        <SearchField
          value={search}
          onChange={setSearch}
          label="Rechercher un client"
          placeholder="Nom, code, téléphone, email, ville…"
          className="lg:w-80"
        />
        {types.length > 0 && (
          <SegmentedFilter options={typeOptions} value={typeFilter} onChange={setTypeFilter} label="Type de client" className="lg:flex-1" />
        )}
        {zones.length > 1 && (
          <div className="lg:w-48">
            <label htmlFor="client-zone" className="sr-only">Zone</label>
            <select id="client-zone" value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="ui-select">
              <option value="all">Toutes les zones</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>
        )}
      </Toolbar>

      {error && (
        <InlineAlert tone="error" title="Impossible de charger les clients.">
          {String(error.message || error)}
        </InlineAlert>
      )}

      <section className="ui-card overflow-hidden" aria-label="Liste des clients">
        {loading ? (
          <table className="ui-table">
            <tbody>
              <SkeletonTableRows rows={6} columns={5} />
            </tbody>
          </table>
        ) : !error && filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucun client trouvé"
            description={hasFilters ? 'Aucun client ne correspond à ces critères.' : 'Aucun client enregistré pour le moment.'}
            action={hasFilters && (
              <button type="button" onClick={resetFilters} className="ui-btn-secondary">Réinitialiser les filtres</button>
            )}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th scope="col">Client</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Localisation</th>
                    <th scope="col">Fiche</th>
                    <th scope="col" className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((client) => (
                    <tr key={client.id} className="cursor-pointer" onClick={() => goTo360(client)}>
                      <td>
                        <div className="flex min-w-0 items-center gap-3">
                          <ClientAvatar client={client} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">{client.name || '—'}</p>
                            <p className="flex items-center gap-2 text-xs text-ink-muted">
                              <span className="ui-ref">{client.code || `#${client.id}`}</span>
                              {client.type && <span>{client.type}</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex max-w-[15rem] flex-col gap-1 text-sm">
                          <ContactLine icon={Phone} value={client.phone} fallback="Non renseigné" />
                          <ContactLine icon={Mail} value={client.email} fallback="Non renseigné" />
                        </div>
                      </td>
                      <td>
                        <div className="flex max-w-[14rem] flex-col gap-0.5 text-sm">
                          <span className="truncate font-medium text-ink">{client.city || '—'}</span>
                          <span className="truncate text-xs text-ink-muted">{[client.zone, client.address].filter(Boolean).join(' · ')}</span>
                        </div>
                      </td>
                      <td><CompletenessBadge client={client} /></td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); goTo360(client) }}
                            className="ui-btn-secondary ui-btn-sm"
                          >
                            Fiche 360°
                            <ArrowUpRight size={14} aria-hidden="true" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(client) }}
                              className="ui-icon-btn h-9 w-9 hover:text-red-600"
                              aria-label={`Supprimer ${client.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-line md:hidden">
              {visible.map((client) => (
                <li key={client.id} className="flex flex-col gap-3 p-4">
                  <button type="button" onClick={() => goTo360(client)} className="flex min-w-0 items-center gap-3 text-left">
                    <ClientAvatar client={client} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{client.name || '—'}</span>
                      <span className="flex items-center gap-2 text-xs text-ink-muted">
                        <span className="ui-ref">{client.code || `#${client.id}`}</span>
                        {client.type}
                      </span>
                    </span>
                    <ArrowUpRight size={16} className="shrink-0 text-ink-faint" aria-hidden="true" />
                  </button>
                  <div className="grid grid-cols-1 gap-1.5 text-sm">
                    <ContactLine icon={Phone} value={client.phone} fallback="Téléphone non renseigné" />
                    <ContactLine icon={Mail} value={client.email} fallback="Email non renseigné" />
                    <ContactLine icon={MapPin} value={[client.city, client.zone].filter(Boolean).join(' · ')} fallback="Adresse non renseignée" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <CompletenessBadge client={client} />
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(client)}
                        className="ui-btn-ghost ui-btn-sm text-red-600"
                      >
                        <Trash2 size={14} aria-hidden="true" /> Supprimer
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <nav className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-ink-muted" aria-label="Pagination">
                <span>Page {safePage} sur {totalPages}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="ui-icon-btn h-9 w-9" aria-label="Page précédente">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="ui-icon-btn h-9 w-9" aria-label="Page suivante">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </section>

      {!loading && zones.length > 0 && (
        <p className="flex items-center gap-2 text-xs text-ink-faint">
          <Map size={13} aria-hidden="true" /> Zones couvertes : {zones.join(', ')}
        </p>
      )}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Supprimer ce client ?"
        description="Cette action est irréversible."
        icon={AlertTriangle}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="ui-btn-secondary">Annuler</button>
            <button type="button" onClick={handleDeleteConfirm} disabled={deleting} className="ui-btn-danger">
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          Le client <strong className="text-ink">{deleteTarget?.name}</strong> sera retiré de l&apos;annuaire. Les machines et interventions associées peuvent être impactées.
        </p>
      </Modal>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
