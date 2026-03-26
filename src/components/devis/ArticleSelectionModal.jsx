import React, { useEffect, useMemo, useState } from 'react'
import { X, Search, Package, Plus } from 'lucide-react'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount || 0)
}

const readNumeric = (source, keys, fallback = 0) => {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== null && value !== undefined && value !== '') {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
  }
  return fallback
}

const readString = (source, keys, fallback = null) => {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== null && value !== undefined) {
      const normalized = String(value).trim()
      if (normalized) {
        return normalized
      }
    }
  }
  return fallback
}

const ArticleSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [articles, setArticles] = useState([])

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setArticles([])
      setError(null)
      return
    }

    const fetchArticles = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('auth_token')
        const url = new URL('http://localhost:3000/articles')
        if (searchTerm.trim()) {
          url.searchParams.append('search', searchTerm.trim())
        }
        url.searchParams.append('limit', '30')

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Erreur serveur: ${response.status}`)
        }

        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          console.debug('[ArticleSelectionModal] API sample article', {
            CODE: data[0].CODE,
            CodeTVA: data[0].CodeTVA,
            AnneeTaxe: data[0].AnneeTaxe,
            TauxTVA: data[0].TauxTVA,
            TVA: data[0].TVA,
            REM: data[0].REM,
            PV: data[0].PV
          })
        }
        setArticles(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error loading articles:', err)
        setError('Impossible de charger les articles')
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchArticles, 250)
    return () => clearTimeout(timer)
  }, [isOpen, searchTerm])

  const normalizedArticles = useMemo(() => {
    const byCode = new Map()

    for (const article of articles) {
      const code = readString(article, ['CODE'], '')
      if (!code || byCode.has(code)) {
        continue
      }

      byCode.set(code, {
        CODE: code,
        LIBELL: readString(article, ['LIBELL'], ''),
        PV: readNumeric(article, ['PV'], 0),
        tva: readNumeric(article, ['TauxTVA', 'TVA', 'tauxmaj'], 0),
        remise: readNumeric(article, ['REM', 'Remise'], 0),
        codeTva: readString(article, ['CodeTVA', 'CODTAXE']),
        anneeTaxe: readNumeric(article, ['AnneeTaxe'], null),
      })
    }

    return Array.from(byCode.values())
  }, [articles])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-4xl h-[82vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Sélectionner un article</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Choisissez un article à ajouter au devis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all"
          >
            <X size={18} className="mx-auto" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par code ou désignation..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 font-bold">{error}</div>
          ) : normalizedArticles.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              Aucun article trouvé
            </div>
          ) : (
            <div className="space-y-2">
              {normalizedArticles.map((article, index) => (
                <div
                  key={`${article.CODE}-${article.codeTva ?? 'NA'}-${index}`}
                  className="border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                >
                  <div>
                    <div className="text-xs font-black text-blue-700 uppercase tracking-widest">
                      {article.CODE}
                    </div>
                    <div className="text-sm font-bold text-slate-800">{article.LIBELL}</div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-1 flex flex-wrap gap-3">
                      <span>PV: <span className="text-slate-800">{formatCurrency(article.PV)} TND</span></span>
                      <span>Code TVA: <span className="text-slate-800">{article.codeTva ?? '-'}</span></span>
                      <span>Taux TVA: <span className="text-slate-800">{article.tva}%</span></span>
                      <span>Année taxe: <span className="text-slate-800">{article.anneeTaxe ?? '-'}</span></span>
                      {article.remise > 0 && (
                        <span className="text-amber-600 font-bold">Rem: <span className="text-slate-800">{article.remise}%</span></span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelect(article)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider hover:bg-blue-600 transition-all"
                  >
                    <Plus size={14} />
                    Ajouter
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ArticleSelectionModal
