import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { X, Search, Package, Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

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
      try { controllerRef.current?.abort() } catch {}
    }
  }, [])

  const fetchArticles = useCallback(async (search, pageNum) => {
    try { controllerRef.current?.abort() } catch {}
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

      setArticles(Array.isArray(data.items) ? data.items : [])
      setPagination({
        page: data.page || pageNum,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
        hasNext: Boolean(data.hasNext),
      })
    } catch (err) {
      if (err.name === 'AbortError') return
      if (!isMountedRef.current) return
      setError(err.message || 'Erreur de chargement')
      setArticles([])
    } finally {
      if (isMountedRef.current && !controller.signal.aborted) setLoading(false)
    }
  }, [])

  // Modal open: reset state. Le fetch est piloté uniquement par l'effet
  // debouncedSearch ci-dessous (une seule source de vérité, comme DevisList).
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setDebouncedSearch('')
      setArticles([])
      setError(null)
      setPagination({ page: 1, total: 0, totalPages: 0, hasNext: false })
      return
    }
    // À l'ouverture : charge la page 1 immédiatement.
    fetchArticles('', 1)
    return () => { try { controllerRef.current?.abort() } catch {} }
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
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Package size={20} /></div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Sélectionner un article</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {pagination.total > 0 ? `${pagination.total} articles` : 'Catalogue'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Recherche optionnelle par code ou désignation..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
        </div>

        {/* Table Header */}
        <div className="px-6 py-2 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="grid grid-cols-[1.2fr_2.5fr_90px_80px_70px_70px_44px] gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>Code</span>
            <span>Désignation</span>
            <span className="text-right">PV (TND)</span>
            <span className="text-center">Code TVA</span>
            <span className="text-center">Taux %</span>
            <span className="text-center">Année</span>
            <span></span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-11 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 font-bold mb-4">{error}</p>
              <button onClick={() => fetchArticles(debouncedSearch, pagination.page)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-all">
                <RefreshCw size={14} /> Réessayer
              </button>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">Aucun article trouvé</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-50">
                {articles.map((article) => (
                  <tr
                    key={article.CODE}
                    onClick={() => handleSelect(article)}
                    className="px-6 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="pl-6 py-2.5 w-[14%]">
                      <span className="text-xs font-black text-blue-700 uppercase tracking-wide">{article.CODE}</span>
                    </td>
                    <td className="py-2.5 w-[34%]">
                      <span className="text-sm font-medium text-slate-800 line-clamp-1">{article.LIBELL}</span>
                    </td>
                    <td className="py-2.5 w-[12%] text-right">
                      <span className="text-xs font-bold text-slate-700 tabular-nums">{formatCurrency(article.PV)}</span>
                    </td>
                    <td className="py-2.5 w-[10%] text-center">
                      <span className="text-[10px] font-bold text-slate-500">{article.CodeTVA || '—'}</span>
                    </td>
                    <td className="py-2.5 w-[9%] text-center">
                      <span className="text-xs font-bold text-emerald-700">{article.TauxTVA ? `${article.TauxTVA}%` : '—'}</span>
                    </td>
                    <td className="py-2.5 w-[9%] text-center">
                      <span className="text-[10px] font-medium text-slate-400">{article.AnneeTaxe || '—'}</span>
                    </td>
                    <td className="pr-6 py-2.5 w-[6%]">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelect(article) }}
                        className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
                      >
                        <Plus size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && !error && articles.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} /> Précédent
            </button>

            <div className="flex items-center gap-1">
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    p === pagination.page
                      ? 'bg-blue-600 text-white shadow-sm'
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
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArticleSelectionModal
