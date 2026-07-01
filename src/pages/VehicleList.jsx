import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus, Search, Eye, Edit2, Trash2, Truck, CheckCircle2,
  Wrench, XCircle, RefreshCw,
  AlertCircle, X, Calendar,
} from 'lucide-react'
import { apiFetch } from '../api/apiClient'
import CompactPagination from '../components/common/CompactPagination'

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  'Disponible':    { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  'Affecté':       { badge: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500',    icon: Truck },
  'En maintenance':{ badge: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500',   icon: Wrench },
  'Hors service':  { badge: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500',     icon: XCircle },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${cfg.badge}`}>
      <Icon size={11} />
      {status}
    </span>
  )
}

function formatVehicleUsage(vehicle) {
  const mission = vehicle?.activeMission || null
  if (!mission) return null

  const technicians = String(mission.employeeDisplay || mission.employee || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .join(', ')
  const location = mission.site || mission.address || ''

  return {
    primary: `Mission #${mission.id}${technicians ? ` — ${technicians}` : ''}`,
    secondary: location || (mission.type ? mission.type : ''),
  }
}

const KPI_CONFIG = [
  { key: 'total',      label: 'Total',          bg: 'bg-blue-50',    border: 'border-blue-100',    icon_bg: 'bg-blue-100 text-blue-600',     icon: Truck },
  { key: 'disponibles',label: 'Disponibles',    bg: 'bg-emerald-50', border: 'border-emerald-100', icon_bg: 'bg-emerald-100 text-emerald-600',icon: CheckCircle2 },
  { key: 'affectes',   label: 'Affectés',       bg: 'bg-blue-50',    border: 'border-blue-100',    icon_bg: 'bg-blue-100 text-blue-600',     icon: Truck },
  { key: 'maintenance',label: 'En maintenance', bg: 'bg-amber-50',   border: 'border-amber-100',   icon_bg: 'bg-amber-100 text-amber-600',   icon: Wrench },
  { key: 'horsService',label: 'Hors service',   bg: 'bg-red-50',     border: 'border-red-100',     icon_bg: 'bg-red-100 text-red-600',       icon: XCircle },
]

function KpiCard({ label, value, icon, bg, border, icon_bg }) {
  const KpiIcon = icon
  return (
    <div className={`rounded-2xl border ${border} ${bg} p-4 sm:p-5 flex items-center gap-4`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${icon_bg}`}>
        <KpiIcon size={18} />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  )
}

const ITEMS_PER_PAGE = 10

export default function VehicleList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [vehicles, setVehicles] = useState([])
  const [stats, setStats] = useState({ total: 0, disponibles: 0, affectes: 0, maintenance: 0, horsService: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState(null)
  const toastRef = useRef(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [vRes, sRes] = await Promise.all([
        apiFetch('/vehicles', { auth: true }),
        apiFetch('/vehicles/stats', { auth: true }),
      ])
      if (vRes.ok) setVehicles(await vRes.json())
      if (sRes.ok) setStats(await sRes.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const state = location.state
    if (state?.toast) {
      setToast(state.toast)
      if (toastRef.current) clearTimeout(toastRef.current)
      toastRef.current = setTimeout(() => setToast(null), 3500)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const q = search.toLowerCase()
      const matchSearch = !q || [v.matricule, v.marque, v.modele, v.type]
        .some((val) => val && String(val).toLowerCase().includes(q))
      const matchStatut = filterStatut === 'all' || v.statut === filterStatut
      return matchSearch && matchStatut
    })
  }, [vehicles, search, filterStatut])

  useEffect(() => { setCurrentPage(1) }, [search, filterStatut])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Supprimer le véhicule "${vehicle.matricule}" ?`)) return
    try {
      const res = await apiFetch(`/vehicles/${vehicle.id}`, { method: 'DELETE', auth: true })
      if (res.ok) {
        setToast({ type: 'success', message: 'Véhicule supprimé avec succès.' })
        if (toastRef.current) clearTimeout(toastRef.current)
        toastRef.current = setTimeout(() => setToast(null), 3000)
        fetchData()
      } else {
        const errBody = await res.json().catch(() => ({}))
        setToast({ type: 'error', message: errBody.message || 'Erreur lors de la suppression.' })
        if (toastRef.current) clearTimeout(toastRef.current)
        toastRef.current = setTimeout(() => setToast(null), 4000)
      }
    } catch (e) { console.error(e) }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-5 z-[120] animate-in fade-in duration-200">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold ${
            toast.type === 'success' ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-700'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="flex-1 truncate">{toast.message}</span>
            <button onClick={() => setToast(null)} className="shrink-0 text-slate-400 hover:text-slate-600"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:h-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
              <Truck size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">Parc Véhicules</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{vehicles.length} véhicules</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestion flotte</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
            <button onClick={fetchData} disabled={loading} className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
            <button
              onClick={() => navigate('/vehicles/create')}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-3 bg-[#0052CC] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-[#0042a3] transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={3} /> Nouveau véhicule
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {KPI_CONFIG.map(({ key, label, bg, border, icon_bg, icon }) => (
            <KpiCard key={key} label={label} value={stats[key] ?? 0} icon={icon} bg={bg} border={border} icon_bg={icon_bg} />
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par matricule, marque, modèle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
            >
              <option value="all">Tous les statuts</option>
              <option value="Disponible">Disponible</option>
              <option value="Affecté">Affecté</option>
              <option value="En maintenance">En maintenance</option>
              <option value="Hors service">Hors service</option>
            </select>
            {(search || filterStatut !== 'all') && (
              <button onClick={() => { setSearch(''); setFilterStatut('all') }} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Réinitialiser">
                <RefreshCw size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 lg:py-24 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 bg-slate-50 lg:bg-transparent rounded-2xl lg:rounded-none">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:p-0 bg-slate-50 lg:bg-transparent rounded-2xl lg:rounded-none">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm lg:shadow-none p-10 sm:p-16 text-center">
              <Truck size={48} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-semibold">Aucun véhicule trouvé</p>
              <p className="text-slate-400 text-sm mt-1">Modifiez vos filtres ou ajoutez un nouveau véhicule.</p>
            </div>
          </div>
        ) : (
          <div className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:p-0 bg-slate-50 lg:bg-white lg:rounded-2xl lg:border lg:border-slate-200 lg:shadow-sm lg:overflow-hidden">
            {/* Mobile / tablet cards */}
            <div className="lg:hidden space-y-4 sm:space-y-5">
              {paginated.map((v) => {
                const usage = formatVehicleUsage(v)
                return (
                  <div
                    key={v.id}
                    onClick={() => navigate(`/vehicles/${v.id}`)}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-5 transition active:scale-[0.99] sm:hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-black text-slate-900">{v.matricule}</p>
                        <p className="text-sm font-bold text-slate-700 mt-0.5 truncate">
                          {v.marque}{v.modele ? ` — ${v.modele}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={v.statut} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {v.type && (
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{v.type}</span>
                      )}
                      {v.annee && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <Calendar size={11} /> {v.annee}
                        </span>
                      )}
                      {v.statut === 'Affecté' && !v.activeMission && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                          <AlertCircle size={10} /> Sans mission active
                        </span>
                      )}
                    </div>

                    {usage ? (
                      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Utilisation actuelle</p>
                        <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{usage.primary}</p>
                        {usage.secondary && <p className="text-[11px] text-slate-500 truncate mt-0.5">{usage.secondary}</p>}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs font-semibold text-slate-400">Aucune utilisation actuelle</p>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => navigate(`/vehicles/${v.id}`)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors">
                        <Eye size={14} /> Voir
                      </button>
                      <button onClick={() => navigate(`/vehicles/${v.id}/edit`)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors">
                        <Edit2 size={14} /> Modifier
                      </button>
                      <button onClick={() => handleDelete(v)} className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors">
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Matricule</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Marque / Modèle</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Année</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Statut</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Utilisation actuelle</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((v, idx) => (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/vehicles/${v.id}`)}
                      className={`cursor-pointer hover:bg-blue-50/50 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{v.matricule}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{v.marque}</p>
                        {v.modele && <p className="text-[11px] text-slate-400">{v.modele}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{v.type}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">{v.annee}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={v.statut} />
                        {v.statut === 'Affecté' && !v.activeMission && (
                          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                            <AlertCircle size={10} /> Sans mission active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {formatVehicleUsage(v) ? (
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{formatVehicleUsage(v).primary}</p>
                            {formatVehicleUsage(v).secondary && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{formatVehicleUsage(v).secondary}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-slate-400">Aucune utilisation actuelle</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => navigate(`/vehicles/${v.id}`)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Voir">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => navigate(`/vehicles/${v.id}/edit`)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Modifier">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDelete(v)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Supprimer">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <CompactPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={ITEMS_PER_PAGE}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
              className="mt-4 lg:mt-0 bg-white rounded-2xl border border-slate-200 shadow-sm lg:rounded-none lg:border-0 lg:border-t lg:border-slate-100 lg:shadow-none px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            />
          </div>
        )}
      </main>
    </div>
  )
}
