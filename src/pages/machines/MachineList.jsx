import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import CompactPagination from '../../components/common/CompactPagination'
import {
  Search, Plus, Eye, Edit2, Trash2, Settings, RefreshCw,
  LayoutGrid, LayoutList, Building2, Tag, AlertCircle,
  MoreHorizontal, X, Cpu, FileText,
  CheckCircle2,
  Truck, CalendarDays,
} from 'lucide-react'

function normalizeRole(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getStoredRole() {
  if (typeof window === 'undefined') return ''
  const stored = window.localStorage.getItem('auth_user')
  if (!stored) return ''
  try {
    return JSON.parse(stored)?.role || ''
  } catch {
    return ''
  }
}

function ActionMenu({ machine, onEdit, onDelete, onView, canManage }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-44 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</p>
          </div>
          <button onClick={() => { onView(machine); setOpen(false) }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Eye size={14} /> Voir les détails
          </button>
          {canManage && (
            <>
              <button onClick={() => { onEdit(machine); setOpen(false) }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Edit2 size={14} /> Modifier
              </button>
              <div className="border-t border-slate-50" />
              <button onClick={() => { onDelete(machine); setOpen(false) }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 size={14} /> Supprimer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MachineCard({ machine, onView, onEdit, onDelete, canManage }) {
  const imageSrc =
    typeof machine.imageUrl === 'string'
      ? machine.imageUrl.trim().replace(/^`+|`+$/g, '')
      : machine.imageUrl

  return (
    <div
      onClick={() => onView(machine)}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
    >
      <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={machine.designation}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain bg-white/60 p-2 group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Cpu size={48} className="text-slate-300" />
          </div>
        )}
        {machine.category && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-black px-2 py-1 rounded-lg border border-white/50">
              {machine.category}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{machine.designation}</p>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">{machine.code}</p>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <ActionMenu machine={machine} onView={onView} onEdit={onEdit} onDelete={onDelete} canManage={canManage} />
          </div>
        </div>
        <div className="space-y-1.5">
          {machine.brand && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Tag size={11} className="text-slate-300 shrink-0" />
              <span className="truncate">{machine.brand}{machine.model ? ` — ${machine.model}` : ''}</span>
            </div>
          )}
          {machine.supplier && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Truck size={11} className="text-slate-300 shrink-0" />
              <span className="truncate">{machine.supplier}</span>
            </div>
          )}
          {machine.receptionDate && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <CalendarDays size={11} className="text-slate-300 shrink-0" />
              <span className="truncate">Reception: {machine.receptionDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MachineList({ currentUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState(null)
  const toastRef = useRef(null)
  const ITEMS_PER_PAGE = 10
  const normalizedRole = normalizeRole(currentUser?.role || getStoredRole())
  const canManageMachines = !normalizedRole || normalizedRole !== 'technicien'

  const fetchMachines = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/machines', { auth: true })
      if (res.ok) setMachines(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMachines() }, [])

  useEffect(() => {
    const state = location.state
    if (state?.toast) {
      setToast(state.toast)
      if (toastRef.current) clearTimeout(toastRef.current)
      toastRef.current = setTimeout(() => setToast(null), 3500)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  const filtered = useMemo(() => {
    return machines.filter((m) => {
      const q = search.toLowerCase()
      return !q || [m.code, m.designation, m.brand, m.model, m.supplier, m.serialNumber, m.purchaseOrderNumber, m.receptionDate]
        .some((v) => v && String(v).toLowerCase().includes(q))
    })
  }, [machines, search])

  useEffect(() => { setCurrentPage(1) }, [search])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleDelete = async (machine) => {
    if (!window.confirm(`Supprimer la machine "${machine.designation}" ?`)) return
    try {
      const res = await apiFetch(`/machines/${machine.id}`, { method: 'DELETE', auth: true })
      if (res.ok) {
        setToast({ type: 'success', message: 'Machine supprimée avec succès.' })
        if (toastRef.current) clearTimeout(toastRef.current)
        toastRef.current = setTimeout(() => setToast(null), 3000)
        fetchMachines()
      }
    } catch (e) { console.error(e) }
  }

  const listSummary = useMemo(() => {
    const withSupplier = machines.filter((m) => Boolean(m.supplier)).length
    const withDocumentation = machines.filter((m) => {
      try {
        const docs = m.documentsJson ? JSON.parse(m.documentsJson) : []
        return Array.isArray(docs) && docs.length > 0
      } catch {
        return false
      }
    }).length
    const recentReception = machines.filter((m) => {
      if (!m.receptionDate) return false
      const d = new Date(m.receptionDate)
      if (Number.isNaN(d.getTime())) return false
      const now = new Date()
      const diff = now.getTime() - d.getTime()
      return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 30
    }).length

    return { withSupplier, withDocumentation, recentReception }
  }, [machines])

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-5 z-[120] animate-in fade-in duration-200">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold ${
            toast.type === 'success' ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-700'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <div className="min-w-0 flex-1">
              <span className="block truncate">{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="shrink-0 ml-2 text-slate-400 hover:text-slate-600"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-0 sm:h-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
              <Settings size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">Parc Machines</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{machines.length} machines</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestion équipements</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
            <button onClick={fetchMachines} disabled={loading} className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
            {canManageMachines && (
              <button onClick={() => navigate('/machines/create')} className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-3 bg-[#0052CC] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-[#0042a3] transition-all active:scale-95">
                <Plus size={18} strokeWidth={3} /> Nouvelle machine
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-slate-100">
              <Building2 size={20} className="text-slate-700" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{listSummary.withSupplier}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avec fournisseur renseigne</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50">
              <FileText size={20} className="text-blue-700" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{listSummary.withDocumentation}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avec documentation PDF</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50">
              <CalendarDays size={20} className="text-emerald-700" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{listSummary.recentReception}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Receptions sur 30 jours</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par code, designation, marque, fournisseur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            {search && (
              <button onClick={() => setSearch('')} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Reinitialiser la recherche">
                <RefreshCw size={16} />
              </button>
            )}
            <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-end gap-2">
              <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-100'}`}>
                <LayoutList size={18} />
              </button>
              <button onClick={() => setViewMode('grid')} className={`hidden sm:block p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-100'}`}>
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
            <Cpu size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-semibold">Aucune machine trouvée</p>
            <p className="text-slate-400 text-sm mt-1">Modifiez vos filtres ou ajoutez une nouvelle machine.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {paginated.map((machine) => (
              <MachineCard key={machine.id} machine={machine}
                onView={(item) => navigate(`/machines/${item.id}`)}
                onEdit={(item) => navigate(`/machines/${item.id}/edit`)}
                onDelete={handleDelete}
                canManage={canManageMachines}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Mobile / tablet cards */}
            <div className="lg:hidden p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paginated.map((machine) => (
                <MachineCard key={machine.id} machine={machine}
                  onView={(item) => navigate(`/machines/${item.id}`)}
                  onEdit={(item) => navigate(`/machines/${item.id}/edit`)}
                  onDelete={handleDelete}
                  canManage={canManageMachines}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Machine</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Marque / Modèle</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Fournisseur / Reception</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Catégorie</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((m, idx) => (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/machines/${m.id}`)}
                      className={`cursor-pointer hover:bg-blue-50/50 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {m.imageUrl
                              ? <img src={m.imageUrl} alt={m.designation} className="w-full h-full object-cover" />
                              : <Cpu size={18} className="text-slate-400" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">{m.designation}</p>
                            <p className="text-[11px] font-mono text-slate-400 truncate">{m.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">{m.brand || '—'}</p>
                        {m.model && <p className="text-[11px] text-slate-400">{m.model}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700 min-w-0">
                          <Truck size={13} className="text-slate-300" />
                          <span className="truncate">{m.supplier || '—'}</span>
                        </div>
                        {m.receptionDate && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 min-w-0">
                            <CalendarDays size={11} className="text-slate-300" />
                            <span className="truncate">{m.receptionDate}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {m.category
                          ? <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{m.category}</span>
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => navigate(`/machines/${m.id}`)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Voir">
                            <Eye size={15} />
                          </button>
                          {canManageMachines && (
                            <>
                              <button onClick={() => navigate(`/machines/${m.id}/edit`)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Modifier">
                                <Edit2 size={15} />
                              </button>
                              <button onClick={() => handleDelete(m)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Supprimer">
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
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
            />
          </div>
        )}
      </main>
    </div>
  )
}
