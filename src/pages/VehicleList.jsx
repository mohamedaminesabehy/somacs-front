import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus, Eye, Edit2, Trash2, Truck, CheckCircle2, Wrench, XCircle, RefreshCw,
  AlertTriangle, MapPin, User, ChevronRight, CalendarDays,
} from 'lucide-react'
import { apiFetch } from '../api/apiClient'
import CompactPagination from '../components/common/CompactPagination'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import { EmptyState } from '../components/ui/Feedback'
import { StatStrip, SearchField, SegmentedFilter, Toolbar, Toast } from '../components/ui/DataKit'

const STATUS_META = {
  Disponible: { tone: 'teal', icon: CheckCircle2, key: 'disponibles' },
  Affecté: { tone: 'brand', icon: Truck, key: 'affectes' },
  'En maintenance': { tone: 'amber', icon: Wrench, key: 'maintenance' },
  'Hors service': { tone: 'red', icon: XCircle, key: 'horsService' },
}
const STATUSES = Object.keys(STATUS_META)
const ITEMS_PER_PAGE = 10

function formatVehicleUsage(vehicle) {
  const mission = vehicle?.activeMission || null
  if (!mission) return null
  const technicians = String(mission.employeeDisplay || mission.employee || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .join(', ')
  return {
    missionId: mission.id,
    technicians,
    location: mission.site || mission.address || mission.type || '',
  }
}

function Plate({ value }) {
  return (
    <span className="inline-flex items-center overflow-hidden rounded-md border border-ink/80 bg-white font-mono text-[13px] font-bold tracking-wide text-ink shadow-[inset_0_-1px_0_rgba(15,23,42,0.08)]">
      <span className="bg-navy px-1.5 py-1 text-[9px] font-semibold leading-none text-white" aria-hidden="true">TN</span>
      <span className="px-2 py-0.5">{value || '—'}</span>
    </span>
  )
}

function UsageCell({ vehicle }) {
  const usage = formatVehicleUsage(vehicle)
  if (usage) {
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-semibold text-ink">Mission #{usage.missionId}</span>
        <span className="flex min-w-0 items-center gap-3 text-xs text-ink-muted">
          {usage.technicians && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <User size={12} aria-hidden="true" /> <span className="truncate">{usage.technicians}</span>
            </span>
          )}
          {usage.location && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin size={12} aria-hidden="true" /> <span className="truncate">{usage.location}</span>
            </span>
          )}
        </span>
      </div>
    )
  }
  if (vehicle.statut === 'Affecté') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
        <AlertTriangle size={13} aria-hidden="true" /> Affecté sans mission active
      </span>
    )
  }
  return <span className="text-sm text-ink-faint">Aucune utilisation</span>
}

export default function VehicleList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [vehicles, setVehicles] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const toastRef = useRef(null)

  const showToast = useCallback((next, duration = 3500) => {
    setToast(next)
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), duration)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [vRes, sRes] = await Promise.all([
        apiFetch('/vehicles', { auth: true }),
        apiFetch('/vehicles/stats', { auth: true }),
      ])
      if (vRes.ok) setVehicles(await vRes.json())
      setStats(sRes.ok ? await sRes.json() : null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate, showToast])

  // Les compteurs locaux servent de repli si /vehicles/stats est indisponible,
  // et garantissent la cohérence avec la liste affichée.
  const counts = useMemo(() => {
    const local = { total: vehicles.length, disponibles: 0, affectes: 0, maintenance: 0, horsService: 0 }
    vehicles.forEach((v) => {
      const key = STATUS_META[v.statut]?.key
      if (key) local[key] += 1
    })
    return stats && Number(stats.total) === vehicles.length ? { ...local, ...stats } : local
  }, [vehicles, stats])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return vehicles.filter((v) => {
      const matchSearch = !q || [v.matricule, v.marque, v.modele, v.type]
        .some((val) => val && String(val).toLowerCase().includes(q))
      const matchStatut = filterStatut === 'all' || v.statut === filterStatut
      return matchSearch && matchStatut
    })
  }, [vehicles, search, filterStatut])

  useEffect(() => { setCurrentPage(1) }, [search, filterStatut])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const hasFilters = Boolean(search) || filterStatut !== 'all'

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/vehicles/${pendingDelete.id}`, { method: 'DELETE', auth: true })
      if (res.ok) {
        showToast({ type: 'success', message: 'Véhicule supprimé avec succès.' }, 3000)
        setPendingDelete(null)
        fetchData()
      } else {
        const errBody = await res.json().catch(() => ({}))
        showToast({ type: 'error', message: errBody.message || 'Erreur lors de la suppression.' }, 4500)
      }
    } catch (e) {
      console.error(e)
      showToast({ type: 'error', message: 'Serveur injoignable. Réessayez plus tard.' }, 4500)
    } finally {
      setDeleting(false)
    }
  }

  const statItems = [
    { key: 'all', label: 'Flotte totale', value: counts.total, icon: Truck, tone: 'slate', showShare: false },
    ...STATUSES.map((status) => ({
      key: status,
      label: status === 'Disponible' ? 'Disponibles' : status === 'Affecté' ? 'Affectés' : status,
      value: counts[STATUS_META[status].key],
      icon: STATUS_META[status].icon,
      tone: STATUS_META[status].tone,
    })),
  ]

  const segmentOptions = [
    { value: 'all', label: 'Tous', count: counts.total },
    ...STATUSES.map((status) => ({ value: status, label: status, count: counts[STATUS_META[status].key] })),
  ]

  return (
    <div className="min-h-screen bg-canvas">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="ui-page flex flex-col gap-5">
        <PageHeader
          eyebrow="Flotte"
          title="Véhicules"
          description="Disponibilité et affectation des véhicules de service des techniciens."
          icon={Truck}
          actions={
            <>
              <button type="button" onClick={fetchData} disabled={loading} className="ui-btn-secondary" aria-label="Actualiser">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
                <span className="hidden sm:inline">Actualiser</span>
              </button>
              <button type="button" onClick={() => navigate('/vehicles/create')} className="ui-btn-primary">
                <Plus size={18} aria-hidden="true" /> Nouveau véhicule
              </button>
            </>
          }
        />

        <StatStrip
          items={statItems}
          total={counts.total}
          activeKey={filterStatut}
          onSelect={(key) => setFilterStatut(key || 'all')}
        />

        <Toolbar
          summary={loading ? 'Chargement…' : `${filtered.length} véhicule(s) affiché(s) sur ${vehicles.length}`}
          onReset={hasFilters ? () => { setSearch(''); setFilterStatut('all') } : undefined}
        >
          <SearchField
            value={search}
            onChange={setSearch}
            label="Rechercher un véhicule"
            placeholder="Matricule, marque, modèle, type…"
            className="lg:w-80"
          />
          <SegmentedFilter options={segmentOptions} value={filterStatut} onChange={setFilterStatut} label="Statut du véhicule" className="lg:ml-auto" />
        </Toolbar>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1" aria-busy="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="ui-card flex items-center gap-4 p-4">
                <div className="ui-skeleton h-7 w-28" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="ui-skeleton h-3 w-1/3" />
                  <div className="ui-skeleton h-2.5 w-1/2" />
                </div>
                <div className="ui-skeleton h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="ui-card">
            <EmptyState
              icon={Truck}
              title={hasFilters ? 'Aucun véhicule ne correspond' : 'Aucun véhicule enregistré'}
              description={hasFilters ? 'Modifiez la recherche ou le filtre de statut.' : 'Ajoutez le premier véhicule de la flotte.'}
              action={
                hasFilters ? (
                  <button type="button" className="ui-btn-secondary" onClick={() => { setSearch(''); setFilterStatut('all') }}>Réinitialiser</button>
                ) : (
                  <button type="button" className="ui-btn-primary" onClick={() => navigate('/vehicles/create')}><Plus size={16} aria-hidden="true" /> Nouveau véhicule</button>
                )
              }
            />
          </div>
        ) : (
          <>
            {/* Mobile / tablette : cartes */}
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
              {paginated.map((v) => {
                const meta = STATUS_META[v.statut]
                return (
                  <li key={v.id} className="ui-card flex flex-col overflow-hidden">
                    <button
                      type="button"
                      onClick={() => navigate(`/vehicles/${v.id}`)}
                      className="flex flex-1 flex-col gap-3 p-4 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <Plate value={v.matricule} />
                        <StatusBadge tone={meta?.tone}>{v.statut}</StatusBadge>
                      </div>
                      <div>
                        <p className="font-display text-base font-bold text-ink">{v.marque} {v.modele}</p>
                        <p className="mt-0.5 flex items-center gap-3 text-xs text-ink-muted">
                          {v.type && <span>{v.type}</span>}
                          {v.annee && <span className="inline-flex items-center gap-1"><CalendarDays size={12} aria-hidden="true" />{v.annee}</span>}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                        <UsageCell vehicle={v} />
                      </div>
                    </button>
                    <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
                      <button type="button" onClick={() => navigate(`/vehicles/${v.id}`)} className="flex h-11 items-center justify-center gap-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                        <Eye size={14} aria-hidden="true" /> Voir
                      </button>
                      <button type="button" onClick={() => navigate(`/vehicles/${v.id}/edit`)} className="flex h-11 items-center justify-center gap-1.5 text-xs font-semibold text-ink-soft hover:bg-slate-50">
                        <Edit2 size={14} aria-hidden="true" /> Modifier
                      </button>
                      <button type="button" onClick={() => setPendingDelete(v)} className="flex h-11 items-center justify-center gap-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                        <Trash2 size={14} aria-hidden="true" /> Supprimer
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Desktop : tableau */}
            <div className="ui-card hidden overflow-hidden lg:block">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th scope="col" className="w-44">Immatriculation</th>
                    <th scope="col">Véhicule</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Utilisation actuelle</th>
                    <th scope="col" className="w-36 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((v) => {
                    const meta = STATUS_META[v.statut]
                    return (
                      <tr key={v.id} className="group cursor-pointer" onClick={() => navigate(`/vehicles/${v.id}`)}>
                        <td><Plate value={v.matricule} /></td>
                        <td>
                          <p className="font-semibold text-ink">{v.marque} {v.modele}</p>
                          <p className="mt-0.5 text-xs text-ink-muted">{[v.type, v.annee].filter(Boolean).join(' · ') || '—'}</p>
                        </td>
                        <td><StatusBadge tone={meta?.tone}>{v.statut}</StatusBadge></td>
                        <td className="max-w-xs"><UsageCell vehicle={v} /></td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                            <button type="button" onClick={() => navigate(`/vehicles/${v.id}/edit`)} className="ui-icon-btn h-9 w-9" aria-label={`Modifier ${v.matricule}`}>
                              <Edit2 size={15} />
                            </button>
                            <button type="button" onClick={() => setPendingDelete(v)} className="ui-icon-btn h-9 w-9 hover:bg-red-50 hover:text-red-600" aria-label={`Supprimer ${v.matricule}`}>
                              <Trash2 size={15} />
                            </button>
                            <button type="button" onClick={() => navigate(`/vehicles/${v.id}`)} className="ui-icon-btn h-9 w-9 hover:bg-brand-50 hover:text-brand-700" aria-label={`Ouvrir ${v.matricule}`}>
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <CompactPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={ITEMS_PER_PAGE}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
              className="ui-card flex flex-col justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5"
            />
          </>
        )}
      </div>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => !deleting && setPendingDelete(null)}
        title="Supprimer ce véhicule ?"
        description="Cette action est définitive. Les affectations passées restent dans l'historique des missions."
        icon={Trash2}
        size="sm"
        footer={
          <>
            <button type="button" className="ui-btn-secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>Annuler</button>
            <button type="button" className="ui-btn-danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <RefreshCw size={15} className="animate-spin" aria-hidden="true" /> : <Trash2 size={15} aria-hidden="true" />}
              Supprimer
            </button>
          </>
        }
      >
        {pendingDelete && (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-slate-50 p-3">
            <Plate value={pendingDelete.matricule} />
            <span className="truncate text-sm font-semibold text-ink">{pendingDelete.marque} {pendingDelete.modele}</span>
          </div>
        )}
      </Modal>
    </div>
  )
}
