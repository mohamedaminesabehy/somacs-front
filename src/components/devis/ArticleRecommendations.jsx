import { useEffect, useState, useRef } from 'react'
import { Sparkles, Plus, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { apiFetch, getAuthToken } from '../../api/apiClient'

/**
 * Displays ML-powered article recommendations inside CreateDevis.
 *
 * Props:
 * - currentArticles: array of current devis lines (must have .Code)
 * - onAddArticle: callback receiving a full article object (same shape as ArticleSelectionModal)
 */
const ArticleRecommendations = ({ currentArticles, onAddArticle }) => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [addingCode, setAddingCode] = useState(null)
  const [addError, setAddError] = useState(null)
  const lastFetchKeyRef = useRef('')
  const detailCacheRef = useRef(new Map())

  useEffect(() => {
    const codes = currentArticles
      .map((a) => a.Code)
      .filter(Boolean)

    if (codes.length === 0) {
      setRecommendations([])
      lastFetchKeyRef.current = ''
      return
    }

    // Avoid refetching if the same set of article codes
    const key = codes.sort().join(',')
    if (key === lastFetchKeyRef.current) return
    lastFetchKeyRef.current = key

    const controller = new AbortController()

    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        setAddError(null)

        const token = getAuthToken()
        console.log('[ArticleRecommendations] auth token present:', Boolean(token))
        const path = `/recommendations?articles=${encodeURIComponent(codes.join(','))}&limit=5`

        const response = await apiFetch(path, {
          auth: true,
          signal: controller.signal,
        })

        if (!response.ok) {
          setRecommendations([])
          return
        }

        const data = await response.json()
        setRecommendations(data.recommendations || [])
      } catch (err) {
        if (err.name === 'AbortError') return
        setRecommendations([])
      } finally {
        setLoading(false)
      }
    }

    // Debounce 600ms to avoid calling on every keystroke
    const timer = setTimeout(fetchRecommendations, 600)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [currentArticles])

  /**
   * When user clicks "Ajouter":
   * 1. Fetch full article from /articles/:code/detail (exact lookup, fast)
   * 2. Pass the full article object to onAddArticle (same shape as ArticleSelectionModal)
   */
  const handleAdd = async (rec) => {
    if (addingCode) return // prevent double-click
    const code = String(rec.articleCode || '').trim()
    if (!code) return

    setAddingCode(code)
    setAddError(null)

    try {
      // detail cache hit
      if (detailCacheRef.current.has(code)) {
        onAddArticle(detailCacheRef.current.get(code))
        return
      }

      const token = getAuthToken()
      console.log('[ArticleRecommendations] detail auth token present:', Boolean(token))
      const response = await apiFetch(
        `/articles/${encodeURIComponent(code)}/detail`,
        { auth: true }
      )

      if (!response.ok) {
        if (response.status === 408 || response.status === 504) {
          setAddError('Service trop lent, réessayez.')
        } else {
          setAddError(`Article ${code} introuvable dans le catalogue.`)
        }
        return
      }

      const detail = await response.json()
      if (!detail || !detail.CODE) {
        setAddError(`Article ${code} introuvable dans le catalogue.`)
        return
      }

      // Build the article object in the exact same shape that
      // ArticleSelectionModal passes to selectArticle()
      const full = {
        CODE: detail.CODE,
        LIBELL: detail.LIBELL || rec.designation || '',
        PV: detail.PV || 0,
        tva: detail.TauxTVA ?? detail.TVA ?? detail.tauxmaj ?? 0,
        remise: detail.REM ?? detail.Remise ?? 0,
        codeTva: detail.CodeTVA ?? detail.CODTAXE ?? '',
        anneeTaxe: detail.AnneeTaxe ?? null,
      }
      detailCacheRef.current.set(code, full)
      onAddArticle(full)
    } catch {
      setAddError("Erreur lors de l'ajout. Réessayez.")
    } finally {
      setAddingCode(null)
    }
  }

  // Don't render if no recommendations and not loading
  if (recommendations.length === 0 && !loading) return null

  return (
    <section className="overflow-hidden rounded-[28px] border border-purple-100 bg-gradient-to-br from-purple-50/80 to-white shadow-[0_18px_60px_rgba(147,51,234,0.06)]">
      <div
        className="flex items-center justify-between gap-3 border-b border-purple-100 px-6 py-4 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-purple-900">
              Articles recommandés
            </h3>
            <p className="mt-0.5 text-[10px] font-medium text-purple-500">
              Suggestions IA basées sur l'historique des devis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {recommendations.length > 0 && (
            <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-black text-purple-700">
              {recommendations.length}
            </span>
          )}
          {collapsed ? <ChevronDown size={16} className="text-purple-400" /> : <ChevronUp size={16} className="text-purple-400" />}
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="flex items-center gap-3 px-4 py-6 text-purple-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600" />
              <span className="text-xs font-bold">Analyse en cours...</span>
            </div>
          ) : (
            <>
              {addError && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-2 text-xs font-bold text-red-600 mb-2">
                  {addError}
                </div>
              )}
              {recommendations.map((rec) => (
                <div
                  key={rec.articleCode}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-white px-4 py-3 transition-all hover:border-purple-200 hover:shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-purple-700 uppercase tracking-wider">
                        {rec.articleCode}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-bold text-purple-600">
                        <TrendingUp size={10} />
                        {Math.round(rec.confidence * 100)}%
                      </span>
                    </div>
                    {rec.designation && (
                      <p className="mt-0.5 text-xs font-medium text-slate-600 truncate">
                        {rec.designation}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] font-medium text-slate-400 leading-tight">
                      {rec.reason}
                    </p>
                    <div className="mt-1 flex gap-3 text-[9px] font-bold text-slate-400">
                      <span>Support: {rec.support} devis</span>
                      <span>Lift: {rec.lift}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd(rec)}
                    disabled={addingCode === rec.articleCode}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-sm transition-all hover:bg-purple-700 disabled:opacity-50"
                  >
                    {addingCode === rec.articleCode ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                        Ajout...
                      </>
                    ) : (
                      <>
                        <Plus size={12} />
                        Ajouter
                      </>
                    )}
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default ArticleRecommendations
