import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { X, Search, Package, Plus, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const formatCurrency = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(amount || 0)

/**
 * Article Selection Modal — clean architecture (same philosophy as DevisList)
 *
 * - Single endpoint: GET /articles/select-list
 * - Page 1 loads immediately on open
 * - Pagination-driven browsing
 * - Search is optional (500ms debounce, resets to page 1)
 * - Direct selection from list (zero extra API calls)
 * - All data visible: CODE, LIBELL, PV, CodeTVA, TauxTVA, AnneeTaxe
 */
const ArticleSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [articles, setArticles] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0, hasNext: false })
  const controllerRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      try { controllerRef.current?.abort() } catch {
        // Ignore abort errors during modal cleanup.
      }
    }
  }, [])

  const fetchArticles = useCallback(async (search, pageNum) => {
    try { controllerRef.current?.abort() } catch {
      // Ignore abort errors when replacing the active request.
    }
    const controller = new AbortController()
    controllerRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token')
      const query = new URLSearchParams({ page: String(pageNum), limit: '30' })
      if (search) query.append('search', search)

      const response = await fetch(`${API_BASE_URL}/articles/select-list?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })

      if (!isMountedRef.current || controller.signal.aborted) return
      if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`)

      const data = await response.json()
      if (!isMountedRef.current) return

      const items = Array.isArray(data.items) ? data.items : []
      setArticles(items)
      setPagination({
        page: data.page || pageNum,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
        hasNext: Boolean(data.hasNext),
      })

      // Cache page 1 (sans recherche) dans localStorage pour ouverture instantanée
      if (pageNum === 1 && !search && items.length > 0) {
        try {
          window.localStorage.setItem('articles_page1_cache', JSON.stringify({
            items, total: data.total, totalPages: data.totalPages, hasNext: data.hasNext,
          }))
        } catch {
          // Cache writes are optional.
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      if (!isMountedRef.current) return
      setError(err.message || 'Erreur de chargement')
      setArticles([])
    } finally {
      if (isMountedRef.current && !controller.signal.aborted) setLoading(false)
    }
  }, [])

  // Modal open: affiche le cache local immédiatement, puis rafraîchit en arrière-plan
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setDebouncedSearch('')
      setArticles([])
      setError(null)
      setPagination({ page: 1, total: 0, totalPages: 0, hasNext: false })
      return
    }
    // Afficher le cache page 1 instantanément (si disponible)
    try {
      const cached = window.localStorage.getItem('articles_page1_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.items?.length) {
          setArticles(parsed.items)
          setPagination({ page: 1, total: parsed.total || 0, totalPages: parsed.totalPages || 0, hasNext: Boolean(parsed.hasNext) })
        }
      }
    } catch {
      // Cache reads are optional.
    }
    // Puis rafraîchir depuis le serveur
    fetchArticles('', 1)
    return () => {
      try { controllerRef.current?.abort() } catch {
        // Ignore abort errors during modal cleanup.
      }
    }
  }, [isOpen, fetchArticles])

  // Debounce de la recherche (500ms, comme DevisList)
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, isOpen])

  // Re-fetch UNIQUEMENT quand la recherche debouncée change réellement.
  // Skip la valeur initiale '' (déjà chargée par l'effet d'ouverture) pour
  // éviter le double fetch.
  const prevSearchRef = useRef('')
  useEffect(() => {
    if (!isOpen) {
      prevSearchRef.current = ''
      return
    }
    if (debouncedSearch === prevSearchRef.current) return
    prevSearchRef.current = debouncedSearch
    fetchArticles(debouncedSearch, 1)
  }, [debouncedSearch, isOpen, fetchArticles])

  // Direct selection — zero extra API calls
  const handleSelect = useCallback((article) => {
    const tva = Number(article.TauxTVA ?? 0)
    onSelect({
      CODE: article.CODE,
      LIBELL: article.LIBELL,
      PV: article.PV,
      tva,
      TVA: tva,
      TauxTVA: tva,
      remise: Number(article.Remise ?? 0),
      Remise: Number(article.Remise ?? 0),
      codeTva: article.CodeTVA ?? '',
      CodeTVA: article.CodeTVA ?? '',
      anneeTaxe: article.AnneeTaxe ?? null,
      AnneeTaxe: article.AnneeTaxe ?? null,
      tauxmaj: tva,
    })
  }, [onSelect])

  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1) return
    fetchArticles(debouncedSearch, newPage)
  }, [debouncedSearch, fetchArticles])

  // Page buttons (same logic as DevisList)
  const pageNumbers = useMemo(() => {
    const { totalPages, page } = pagination
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 3) return [1, 2, 3, 4, 5]
    if (page >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [page - 2, page - 1, page, page + 1, page + 2]
  }, [pagination])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[85vh] sm:rounded-3xl">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0052CC] text-white shadow-lg shadow-blue-200">
              <Package size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-slate-900 sm:text-lg">Sélectionner un article</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:text-[11px]">
                {pagination.total > 0 ? `${pagination.total} articles disponibles` : 'Catalogue articles'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-all hover:bg-red-50 hover:text-red-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par code ou désignation..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm font-medium outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition-all hover:bg-slate-300"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Table header intégré dans le <table> desktop ci-dessous */}

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-4 sm:p-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100 sm:h-12" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertCircle size={26} />
              </div>
              <p className="mb-4 text-sm font-bold text-red-600">{error}</p>
              <button
                onClick={() => fetchArticles(debouncedSearch, pagination.page)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#0052CC]"
              >
                <RefreshCw size={14} /> Réessayer
              </button>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Search size={26} />
              </div>
              <p className="text-sm font-bold text-slate-500">Aucun article trouvé</p>
              <p className="mt-1 text-xs text-slate-400">Essayez un autre terme de recherche</p>
            </div>
          ) : (
            <>
              {/* Vue desktop : tableau complet avec thead aligné */}
              <table className="hidden w-full border-collapse text-left sm:table">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm">
                  <tr>
                    <th className="w-[14%] py-2.5 pl-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Code</th>
                    <th className="w-[34%] py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Désignation</th>
                    <th className="w-[12%] py-2.5 pr-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">PV (TND)</th>
                    <th className="w-[11%] py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Code TVA</th>
                    <th className="w-[9%] py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Taux %</th>
                    <th className="w-[9%] py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Année</th>
                    <th className="w-[5%] py-2.5 pr-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {articles.map((article) => (
                    <tr
                      key={article.CODE}
                      onClick={() => handleSelect(article)}
                      className="group cursor-pointer transition-colors hover:bg-blue-50/50"
                    >
                      <td className="py-3 pl-6">
                        <span className="text-xs font-black uppercase tracking-wide text-blue-700">{article.CODE}</span>
                      </td>
                      <td className="py-3 pr-2">
                        <span className="line-clamp-1 text-sm font-medium text-slate-800">{article.LIBELL}</span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className="text-xs font-bold tabular-nums text-slate-700">{formatCurrency(article.PV)}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-[10px] font-bold text-slate-500">{article.CodeTVA || '—'}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-xs font-bold text-emerald-700">{article.TauxTVA ? `${article.TauxTVA}%` : '—'}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-[10px] font-medium text-slate-400">{article.AnneeTaxe || '—'}</span>
                      </td>
                      <td className="py-3 pr-6 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelect(article) }}
                          className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white opacity-0 transition-all hover:bg-blue-600 group-hover:opacity-100"
                        >
                          <Plus size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Vue mobile : cartes */}
              <div className="space-y-3 p-4 sm:hidden">
                {articles.map((article) => (
                  <button
                    key={article.CODE}
                    onClick={() => handleSelect(article)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.98] active:bg-blue-50/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-wide text-blue-700">{article.CODE}</span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                        <Plus size={14} />
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm font-bold text-slate-800">{article.LIBELL}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium">
                      <span className="text-slate-500">
                        PV : <span className="font-black text-slate-800">{formatCurrency(article.PV)} TND</span>
                      </span>
                      <span className="text-slate-500">
                        TVA : <span className="font-bold text-emerald-700">{article.TauxTVA ? `${article.TauxTVA}%` : '—'}</span>
                        {article.CodeTVA ? <span className="text-slate-400"> ({article.CodeTVA})</span> : null}
                      </span>
                      {article.AnneeTaxe ? (
                        <span className="text-slate-400">Année : {article.AnneeTaxe}</span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && !error && articles.length > 0 && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-3 sm:px-6">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30 sm:px-3"
            >
              <ChevronLeft size={16} /> <span className="hidden sm:inline">Précédent</span>
            </button>

            <div className="flex items-center gap-1">
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`h-9 w-9 rounded-lg text-xs font-bold transition-all ${
                    p === pagination.page
                      ? 'bg-[#0052CC] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30 sm:px-3"
            >
              <span className="hidden sm:inline">Suivant</span> <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArticleSelectionModal
