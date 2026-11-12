import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import CompactPagination from '../../components/common/CompactPagination'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import { EmptyState, SkeletonTableRows } from '../../components/ui/Feedback'
import { StatStrip, SearchField, SegmentedFilter, Toolbar, Toast } from '../../components/ui/DataKit'
import {
  Plus, Eye, Pencil, Trash2, Settings, RefreshCw, Cpu, Building2,
  CheckCircle2, Wrench, AlertOctagon, CalendarClock, AlertTriangle,
} from 'lucide-react'

function normalize(raw) {
  return String(raw || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function getStoredRole() {
  if (typeof window === 'undefined') return ''
  try {
    return JSON.parse(window.localStorage.getItem('auth_user') || 'null')?.role || ''
  } catch {
    return ''
  }
}

const STATUS_GROUPS = {
  service: { label: 'En service', tone: 'teal', match: (s) => s.includes('service') && !s.includes('hors') },
  maintenance: { label: 'En maintenance', tone: 'amber', match: (s) => s.includes('maintenance') },
  panne: { label: 'En panne / Hors service', tone: 'red', match: (s) => s.includes('panne') || s.includes('hors') },
}

function statusGroup(status) {
  const s = normalize(status)
  return Object.keys(STATUS_GROUPS).find((key) => STATUS_GROUPS[key].match(s)) || null
}

function MachineStatus({ status }) {
  const group = statusGroup(status)
  return <StatusBadge tone={group ? STATUS_GROUPS[group].tone : 'slate'}>{status || 'Non renseigné'}</StatusBadge>
}

function formatDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function maintenanceState(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000)
  if (days < 0) return { label: `En retard de ${Math.abs(days)} j`, tone: 'text-red-600' }
  if (days <= 14) return { label: `Dans ${days} j`, tone: 'text-amber-700' }
  return { label: formatDate(value), tone: 'text-ink-muted' }
}

function MachineThumb({ machine, size = 'md' }) {
  const src = typeof machine.imageUrl === 'string' ? machine.imageUrl.trim().replace(/^`+|`+$/g, '') : machine.imageUrl
  const dims = size === 'lg' ? 'h-14 w-14' : 'h-11 w-11'
  return (
    <span className={`flex ${dims} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-inset ring-line`}>
      {src ? (
        <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain p-1" />
      ) : (
        <Cpu size={size === 'lg' ? 22 : 18} className="text-ink-faint" aria-hidden="true" />
      )}
    </span>
  )
}

function RowActions({ machine, canManage, onDelete }) {
  const base = 'flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition-colors'
  return (
    <div className="flex items-center justify-end gap-1">
      <Link to={`/machines/${machine.id}`} className={`${base} hover:bg-brand-50 hover:text-brand-700`} aria-label={`Voir ${machine.designation}`}>
        <Eye size={16} />
      </Link>
      {canManage && (
        <>
          <Link to={`/machines/${machine.id}/edit`} className={`${base} hover:bg-brand-50 hover:text-brand-700`} aria-label={`Modifier ${machine.designation}`}>
            <Pencil size={15} />
          </Link>
          <button type="button" onClick={() => onDelete(machine)} className={`${base} hover:bg-red-50 hover:text-red-600`} aria-label={`Supprimer ${machine.designation}`}>
            <Trash2 size={15} />
          </button>
        </>
      )}
    </div>
  )
}

function MachineMobileCard({ machine, canManage, onDelete }) {
  const next = maintenanceState(machine.nextMaintenanceDate)
  return (
    <li className="ui-card flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <MachineThumb machine={machine} />
        <div className="min-w-0 flex-1">
          <Link to={`/machines/${machine.id}`} className="block break-words text-sm font-bold leading-snug text-ink hover:text-brand-700">
            {machine.designation}
          </Link>
          <p className="mt-0.5 font-mono text-xs text-ink-faint">{machine.code}</p>
        </div>
        <MachineStatus status={machine.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs">
        <div className="min-w-0">
          <dt className="text-ink-faint">Marque / modèle</dt>
          <dd className="truncate font-semibold text-ink">{[machine.brand, machine.model].filter(Boolean).join(' · ') || '—'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-ink-faint">N° de série</dt>
          <dd className="truncate font-mono font-semibold text-ink">{machine.serialNumber || '—'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-ink-faint">Client</dt>
          <dd className="truncate font-semibold text-ink">{machine.client || '—'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-ink-faint">Prochaine maintenance</dt>
          <dd className={`truncate font-semibold ${next?.tone || 'text-ink'}`}>{next?.label || '—'}</dd>
        </div>
      </dl>
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="truncate text-xs font-medium text-ink-muted">{machine.category || 'Sans catégorie'}</span>
        <RowActions machine={machine} canManage={canManage} onDelete={onDelete} />
      </div>
    </li>
  )
}

const PAGE_SIZE = 10

export default function MachineList({ currentUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [category, setCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const toastTimer = useRef(null)
  const canManage = normalize(currentUser?.role || getStoredRole()) !== 'technicien'

  const showToast = (next, delay = 3500) => {
    setToast(next)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), delay)
  }

  const fetchMachines = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/machines', { auth: true })
      if (res.ok) setMachines(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMachines() }, [])

  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), [])

  const counts = useMemo(() => {
    const result = { service: 0, maintenance: 0, panne: 0, due: 0 }
    const soon = Date.now() + 14 * 86400000
    machines.forEach((m) => {
      const group = statusGroup(m.status)
      if (group) result[group] += 1
      const next = m.nextMaintenanceDate ? new Date(m.nextMaintenanceDate).getTime() : NaN
      if (!Number.isNaN(next) && next <= soon) result.due += 1
    })
    return result
  }, [machines])

  const categories = useMemo(() => {
    const map = new Map()
    machines.forEach((m) => m.category && map.set(m.category, (map.get(m.category) || 0) + 1))
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'))
  }, [machines])

  const filtered = useMemo(() => {
    const q = normalize(search)
    const soon = Date.now() + 14 * 86400000
    return machines.filter((m) => {
      if (category !== 'all' && m.category !== category) return false
      if (statusFilter === 'due') {
        const next = m.nextMaintenanceDate ? new Date(m.nextMaintenanceDate).getTime() : NaN
        if (Number.isNaN(next) || next > soon) return false
      } else if (statusFilter && statusGroup(m.status) !== statusFilter) return false
      if (!q) return true
      return [m.code, m.designation, m.brand, m.model, m.supplier, m.serialNumber, m.client, m.site, m.purchaseOrderNumber]
        .some((v) => v && normalize(v).includes(q))
    })
  }, [machines, search, statusFilter, category])

  useEffect(() => { setCurrentPage(1) }, [search, statusFilter, category])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasFilters = Boolean(search || statusFilter || category !== 'all')

  const resetFilters = () => {
    setSearch('')
    setStatusFilter(null)
    setCategory('all')
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/machines/${deleteTarget.id}`, { method: 'DELETE', auth: true })
      if (res.ok) {
        setDeleteTarget(null)
        showToast({ type: 'success', message: 'Machine supprimée avec succès.' }, 3000)
        fetchMachines()
      } else {
        showToast({ type: 'error', message: 'Erreur lors de la suppression.' })
      }
    } catch (e) {
      console.error(e)
      showToast({ type: 'error', message: 'Impossible de supprimer la machine.' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-canvas">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          eyebrow="Équipements"
          title="Parc machines"
          description={`${machines.length} équipement(s) suivis chez les clients SOMACS.`}
          icon={Settings}
          actions={
            <>
              <button type="button" onClick={fetchMachines} disabled={loading} className="ui-btn-secondary hidden sm:inline-flex">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Actualiser
              </button>
              {canManage && (
                <button type="button" onClick={() => navigate('/machines/create')} className="ui-btn-primary">
                  <Plus size={18} strokeWidth={2.25} aria-hidden="true" /> Nouvelle machine
                </button>
              )}
            </>
          }
        />

        <StatStrip
          total={machines.length}
          activeKey={statusFilter}
          onSelect={setStatusFilter}
          items={[
            { key: 'service', label: 'En service', value: counts.service, icon: CheckCircle2, tone: 'teal' },
            { key: 'maintenance', label: 'En maintenance', value: counts.maintenance, icon: Wrench, tone: 'amber' },
            { key: 'panne', label: 'En panne / Hors service', value: counts.panne, icon: AlertOctagon, tone: 'red', hint: counts.panne ? 'Intervention à planifier' : undefined, hintTone: 'alert' },
            { key: 'due', label: 'Maintenance sous 14 j', value: counts.due, icon: CalendarClock, tone: 'brand', showShare: false },
          ]}
        />

        <Toolbar
          summary={`${filtered.length} machine(s) affichée(s) sur ${machines.length}`}
          onReset={hasFilters ? resetFilters : undefined}
        >
          <SearchField
            value={search}
            onChange={setSearch}
            label="machines"
            placeholder="Code, désignation, marque, n° de série, client…"
            className="lg:max-w-md lg:flex-1"
          />
          {categories.length > 0 && (
            <SegmentedFilter
              label="Catégorie"
              value={category}
              onChange={setCategory}
              className="lg:ml-auto"
              options={[{ value: 'all', label: 'Toutes', count: machines.length }, ...categories.map(([name, count]) => ({ value: name, label: name, count }))]}
            />
          )}
        </Toolbar>

        {loading ? (
          <div className="ui-card overflow-hidden">
            <table className="ui-table w-full">
              <tbody><SkeletonTableRows rows={5} columns={5} /></tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Cpu}
            title={hasFilters ? 'Aucune machine ne correspond' : 'Aucune machine enregistrée'}
            description={hasFilters ? 'Modifiez la recherche ou réinitialisez les filtres.' : 'Ajoutez le premier équipement du parc.'}
            action={hasFilters ? (
              <button type="button" onClick={resetFilters} className="ui-btn-secondary">Réinitialiser les filtres</button>
            ) : canManage ? (
              <button type="button" onClick={() => navigate('/machines/create')} className="ui-btn-primary"><Plus size={16} /> Nouvelle machine</button>
            ) : null}
          />
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
              {paginated.map((machine) => (
                <MachineMobileCard key={machine.id} machine={machine} canManage={canManage} onDelete={setDeleteTarget} />
              ))}
            </ul>

            <div className="ui-card hidden overflow-hidden lg:block">
              <div className="overflow-x-auto">
                <table className="ui-table w-full min-w-[960px] text-left">
                  <thead>
                    <tr>
                      <th scope="col">Équipement</th>
                      <th scope="col">Marque / modèle</th>
                      <th scope="col">Client / site</th>
                      <th scope="col">Statut</th>
                      <th scope="col">Prochaine maintenance</th>
                      <th scope="col" className="text-right"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((machine) => {
                      const next = maintenanceState(machine.nextMaintenanceDate)
                      return (
                        <tr key={machine.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <MachineThumb machine={machine} />
                              <div className="min-w-0">
                                <Link to={`/machines/${machine.id}`} className="block truncate font-semibold text-ink hover:text-brand-700">
                                  {machine.designation}
                                </Link>
                                <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-faint">
                                  <span className="font-mono">{machine.code}</span>
                                  {machine.category && <><span aria-hidden="true">·</span><span>{machine.category}</span></>}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="font-medium text-ink">{machine.brand || '—'}</p>
                            <p className="mt-0.5 text-xs text-ink-faint">
                              {machine.model || '—'}
                              {machine.serialNumber && <span className="font-mono"> · {machine.serialNumber}</span>}
                            </p>
                          </td>
                          <td>
                            <p className="flex items-center gap-1.5 font-medium text-ink">
                              <Building2 size={13} className="shrink-0 text-ink-faint" aria-hidden="true" />
                              <span className="truncate">{machine.client || '—'}</span>
                            </p>
                            <p className="mt-0.5 text-xs text-ink-faint">{machine.site || machine.location || '—'}</p>
                          </td>
                          <td><MachineStatus status={machine.status} /></td>
                          <td>
                            <p className={`text-sm font-semibold ${next?.tone || 'text-ink-faint'}`}>{next?.label || 'Non planifiée'}</p>
                            {machine.lastMaintenanceDate && (
                              <p className="mt-0.5 text-xs text-ink-faint">Dernière : {formatDate(machine.lastMaintenanceDate)}</p>
                            )}
                          </td>
                          <td><RowActions machine={machine} canManage={canManage} onDelete={setDeleteTarget} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="ui-card overflow-hidden">
                <CompactPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={PAGE_SIZE}
                  totalItems={filtered.length}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Supprimer cette machine ?"
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
        {deleteTarget && (
          <p className="text-sm leading-relaxed text-ink-muted">
            <span className="font-semibold text-ink">{deleteTarget.designation}</span>
            {deleteTarget.code && <span className="font-mono"> ({deleteTarget.code})</span>} sera définitivement retirée du parc.
            L&apos;historique d&apos;interventions associé ne sera plus accessible depuis cette fiche.
          </p>
        )}
      </Modal>
    </div>
  )
}
