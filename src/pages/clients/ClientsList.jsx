import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  Users,
  AlertTriangle,
  ArrowUpRight,
  X,
} from 'lucide-react'
import { apiFetch } from '../../api/apiClient'

const PAGE_SIZE = 12

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getInitials(name) {
  return String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?'
}

// Couleur d'avatar dérivée du nom (sobre, ERP-friendly)
const AVATAR_GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-indigo-500 to-indigo-700',
  'from-violet-500 to-violet-700',
  'from-cyan-500 to-cyan-700',
  'from-teal-500 to-teal-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-700',
  'from-rose-500 to-rose-700',
]
function avatarColor(seed) {
  const s = String(seed || '')
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length]
}

function ClientCardSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/3 bg-slate-100 rounded" />
          <div className="h-2.5 w-1/3 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-2.5 w-full bg-slate-100 rounded" />
        <div className="h-2.5 w-5/6 bg-slate-100 rounded" />
        <div className="h-2.5 w-4/6 bg-slate-100 rounded" />
      </div>
      <div className="mt-5 h-8 w-full bg-slate-100 rounded-lg" />
    </div>
  )
}

export default function ClientsList() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all') // 'all' | 'incomplete'

  const loadClients = () => {
    let alive = true
    setLoading(true)
    setError(null)
    apiFetch('/clients')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => alive && setClients(Array.isArray(data) ? data : []))
      .catch((err) => alive && setError(err))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }

  useEffect(() => loadClients(), [])

  const isIncomplete = (c) => !c.phone && !c.email
  const totalIncomplete = useMemo(() => clients.filter(isIncomplete).length, [clients])

  const filtered = useMemo(() => {
    let list = clients
    if (filter === 'incomplete') list = list.filter(isIncomplete)
    const q = normalize(search.trim())
    if (q) {
      list = list.filter((c) => {
        const haystack = [c.code, c.name, c.phone, c.phone2, c.email, c.city, c.zone, c.address]
          .map((v) => normalize(v))
          .join(' ')
        return haystack.includes(q)
      })
    }
    return list
  }, [clients, search, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * PAGE_SIZE
  const visible = filtered.slice(startIdx, startIdx + PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, filter])

  const goTo360 = (client) => navigate(`/clients/${client.id}/360`)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#0052CC] uppercase tracking-[0.18em] mb-1">
            <Building2 size={12} /> Référentiel
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-1">
            Annuaire SOMACS — accédez à la fiche 360° de chaque client.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadClients}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* KPI compacts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total</p>
              <p className="text-xl font-black text-slate-900">{loading ? '…' : clients.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avec email</p>
              <p className="text-xl font-black text-slate-900">
                {loading ? '…' : clients.filter((c) => c.email).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Phone size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avec téléphone</p>
              <p className="text-xl font-black text-slate-900">
                {loading ? '…' : clients.filter((c) => c.phone).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Incomplets</p>
              <p className="text-xl font-black text-slate-900">{loading ? '…' : totalIncomplete}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recherche + filtres */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative w-full lg:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, code, téléphone, email, ville…"
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('incomplete')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'incomplete' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Données manquantes
          </button>
        </div>

        <p className="lg:ml-auto text-xs text-slate-400">
          {loading
            ? 'Chargement…'
            : <><strong className="text-slate-700">{filtered.length}</strong> résultat(s)</>}
        </p>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0" size={18} />
          <div>
            <p className="text-sm font-bold text-red-700">Impossible de charger les clients.</p>
            <p className="text-xs text-red-600 mt-0.5">{String(error.message || error)}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ClientCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
            <Building2 className="text-slate-300" size={24} />
          </div>
          <p className="text-sm font-bold text-slate-700">Aucun client trouvé</p>
          <p className="text-xs text-slate-400 mt-1">
            {search || filter !== 'all' ? 'Essayez d’ajuster vos filtres.' : 'Aucun client enregistré pour le moment.'}
          </p>
          {(search || filter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilter('all') }}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0052CC] bg-blue-50 hover:bg-blue-100 rounded-lg"
            >
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* Cards */}
      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((client) => {
              const incomplete = isIncomplete(client)
              return (
                <div
                  key={client.id}
                  onClick={() => goTo360(client)}
                  className="group bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarColor(client.code || client.name)} flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0`}>
                      {getInitials(client.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-[#0052CC] uppercase tracking-wider font-mono">
                            {client.code || `#${client.id}`}
                          </p>
                          <p className="text-sm font-black text-slate-800 truncate group-hover:text-[#0052CC] transition-colors">
                            {client.name || '—'}
                          </p>
                        </div>
                        <ArrowUpRight size={14} className="text-slate-300 group-hover:text-[#0052CC] transition-colors shrink-0 mt-0.5" />
                      </div>
                      {client.type && (
                        <span className="inline-flex mt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                          {client.type}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-500 flex-1">
                    <div className="flex items-center gap-2 truncate">
                      <Phone size={12} className={client.phone ? 'text-slate-400' : 'text-slate-200'} />
                      <span className={`truncate ${client.phone ? '' : 'text-slate-300 italic'}`}>
                        {client.phone || 'Téléphone non renseigné'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={12} className={client.email ? 'text-slate-400' : 'text-slate-200'} />
                      <span className={`truncate ${client.email ? '' : 'text-slate-300 italic'}`}>
                        {client.email || 'Email non renseigné'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin size={12} className={(client.city || client.address) ? 'text-slate-400' : 'text-slate-200'} />
                      <span className={`truncate ${(client.city || client.address) ? '' : 'text-slate-300 italic'}`}>
                        {[client.city, client.zone].filter(Boolean).join(' · ') || client.address || 'Adresse non renseignée'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
                    {incomplete ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded">
                        <AlertTriangle size={10} /> À compléter
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">
                        Complet
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); goTo360(client) }}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0052CC] text-white text-xs font-bold rounded-lg hover:bg-[#0047b3] transition-colors shadow-sm"
                    >
                      <Eye size={12} />
                      Voir fiche client
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
