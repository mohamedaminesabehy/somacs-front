import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Eye, Edit2, Trash2, FileText,
  Calendar, User, DollarSign, ChevronRight,
  Filter, RefreshCw, MoreHorizontal, Download, Printer, AlertTriangle,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react'

const DevisList = () => {
  const [devis, setDevis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' or 'desc'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })
  
  // Cache pour le pré-chargement (Prefetching)
  const [prefetchedData, setPrefetchedData] = useState({}) 
  const navigate = useNavigate()

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPagination(prev => ({ ...prev, page: 1 }))
      setPrefetchedData({}) // On vide le cache lors d'une nouvelle recherche
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    // Si on a déjà les données en cache, on les affiche direct
    if (prefetchedData[pagination.page]) {
      setDevis(prefetchedData[pagination.page].data)
      setPagination(prev => ({
        ...prev,
        total: prefetchedData[pagination.page].total,
        totalPages: prefetchedData[pagination.page].totalPages
      }))
      setLoading(false)
      // On pré-charge quand même la suivante
      prefetchNextPage(pagination.page + 1)
    } else {
      fetchDevis(pagination.page)
    }
  }, [pagination.page, debouncedSearch])

  const fetchDevis = async (page) => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('auth_token')
      const url = new URL('http://localhost:3000/devis')
      url.searchParams.append('page', page)
      url.searchParams.append('limit', pagination.limit)
      if (debouncedSearch) {
        url.searchParams.append('search', debouncedSearch)
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const result = await response.json()
        if (result.error) {
          setError(result.error)
          setDevis([])
        } else {
          setDevis(result.data)
          setPagination(prev => ({
            ...prev,
            total: result.total,
            totalPages: result.totalPages
          }))
          // Une fois la page chargée, on pré-charge la suivante en background
          prefetchNextPage(page + 1)
        }
      } else {
        const errData = await response.json().catch(() => ({}))
        setError(errData.message || `Erreur serveur: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching devis:', error)
      setError('Impossible de joindre le serveur. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour charger la page suivante en silence (Background)
  const prefetchNextPage = async (nextPage) => {
    if (nextPage > pagination.totalPages && pagination.totalPages !== 0) return
    if (prefetchedData[nextPage]) return // Déjà en cache

    try {
      const token = localStorage.getItem('auth_token')
      const url = new URL('http://localhost:3000/devis')
      url.searchParams.append('page', nextPage)
      url.searchParams.append('limit', pagination.limit)
      if (debouncedSearch) url.searchParams.append('search', debouncedSearch)

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const result = await response.json()
        setPrefetchedData(prev => ({
          ...prev,
          [nextPage]: result
        }))
      }
    } catch (e) {
      // Échec silencieux pour le pré-chargement
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    setSortOrder(newOrder)
    const sorted = [...devis].sort((a, b) => {
      const dateA = new Date(a.DATDOC)
      const dateB = new Date(b.DATDOC)
      return newOrder === 'asc' ? dateA - dateB : dateB - dateA
    })
    setDevis(sorted)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(amount || 0)
  }

  const getStatusBadge = (item) => {
    if (item.IsAnnuler) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-100">
          Annulé
        </span>
      )
    }
    if (item.ETATDOC === 'C' || item.ETATDOC === 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
          Validé
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
        En attente
      </span>
    )
  }

  const stats = {
    total: pagination.total,
    shown: devis.length,
    validated: devis.filter((item) => item.ETATDOC === 'C' || item.ETATDOC === 3).length,
    cancelled: devis.filter((item) => item.IsAnnuler).length,
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(0,82,204,0.08),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6">
        <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 p-6 lg:p-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#0052CC]">
                <span className="rounded-full bg-blue-50 px-3 py-1">Devis</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">Gestion commerciale</span>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Gestion des devis
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Consultez, filtrez et gérez vos devis dans une interface claire, rapide et professionnelle, conçue pour une lecture fluide sur desktop et mobile.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row xl:flex-col xl:items-end">
              <button
                onClick={() => fetchDevis(pagination.page)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Actualiser
              </button>
              <button
                onClick={() => navigate('/devis/create')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0052CC] px-6 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(0,82,204,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#0747A6]"
              >
                <Plus size={18} />
                Nouveau devis
              </button>
            </div>
          </div>

          <div className="grid gap-4 border-t border-slate-100 p-6 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Total devis</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{stats.total}</div>
              <p className="mt-1 text-xs font-medium text-slate-500">Résultats disponibles dans la base</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Affichés</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{stats.shown}</div>
              <p className="mt-1 text-xs font-medium text-slate-500">Page {pagination.page} sur {pagination.totalPages || 1}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Validés</div>
              <div className="mt-2 text-2xl font-black text-emerald-700">{stats.validated}</div>
              <p className="mt-1 text-xs font-medium text-emerald-700/70">Devis confirmés et exploitables</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Annulés</div>
              <div className="mt-2 text-2xl font-black text-rose-700">{stats.cancelled}</div>
              <p className="mt-1 text-xs font-medium text-rose-700/70">Documents annulés ou obsolètes</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher par numéro, nom ou code client..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
              <button
                onClick={handleSort}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <Calendar size={18} className="text-slate-500" />
                Trier par date {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50">
                <Download size={18} className="text-slate-500" />
                Export
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-3 rounded-[24px] border border-red-200 bg-red-50/90 p-4 text-red-700 shadow-sm">
            <div className="rounded-2xl bg-white p-2 text-red-500 shadow-sm">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-sm font-black">Une erreur est survenue</p>
              <p className="mt-1 text-sm font-medium text-red-700/80">{error}</p>
            </div>
          </div>
        )}

        <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/92 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-base font-black uppercase tracking-[0.3em] text-slate-900">Liste des devis</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">Tableau optimisé pour la lecture rapide, le tri et la navigation.</p>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 md:flex">
              {loading ? 'Synchronisation...' : 'Vue active'}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Numéro</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Type</th>
                  <th
                    className="cursor-pointer px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 transition-colors hover:text-[#0052CC]"
                    onClick={handleSort}
                  >
                    Date de création {sortOrder === 'asc' ? '↑' : '↓'}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Client</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-right text-slate-400">Montant TTC</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">État</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-center text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="7" className="px-6 py-5">
                        <div className="h-14 rounded-2xl bg-slate-100/90" />
                      </td>
                    </tr>
                  ))
                ) : devis.length > 0 ? (
                  devis.map((item) => (
                    <tr
                      key={item.NUMERO}
                      className={`group cursor-pointer transition-colors hover:bg-slate-50/80 ${item.IsAnnuler ? 'bg-rose-50/30 opacity-70' : ''}`}
                      onClick={() => navigate(`/devis/${item.NUMERO}`)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${item.IsAnnuler ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-[#0052CC] group-hover:bg-[#0052CC] group-hover:text-white'}`}>
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className={`truncate text-sm font-black ${item.IsAnnuler ? 'text-rose-900 line-through' : 'text-slate-950'}`}>
                              {item.NUMERO}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">{item.TYPDOC || 'DE'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                          {item.TYPDOC}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="text-sm font-medium">{formatDate(item.DATDOC)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="min-w-0">
                          <div className={`truncate text-sm font-bold ${item.IsAnnuler ? 'text-rose-900/70' : 'text-slate-900'}`}>{item.NOMTIE || 'Client inconnu'}</div>
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">{item.DESTINA || item.CODTIE}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`text-sm font-black ${item.IsAnnuler ? 'text-rose-600' : 'text-slate-950'}`}>
                          {formatCurrency(item.TOTTTCDV)}
                        </span>
                      </td>
                      <td className="px-6 py-5">{getStatusBadge(item)}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/devis/${item.NUMERO}`)
                            }}
                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-[#0052CC] hover:shadow-md"
                          >
                            <Eye size={18} />
                          </button>
                          {!item.IsAnnuler && (
                            <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:text-amber-600 hover:shadow-md">
                              <Edit2 size={18} />
                            </button>
                          )}
                          <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-200 hover:text-red-600 hover:shadow-md">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-slate-100 bg-slate-50 text-slate-300 shadow-sm">
                          <FileText size={42} />
                        </div>
                        <div className="space-y-2">
                          <p className="text-base font-black text-slate-900">Aucun devis trouvé</p>
                          <p className="text-sm leading-6 text-slate-500">
                            Aucun document ne correspond à votre recherche. Essayez un autre numéro, client ou code.
                          </p>
                        </div>
                        <p className="max-w-sm text-xs font-medium italic leading-5 text-slate-400">
                          Le système recherche les documents avec les types 'DE' (Devis) et 'DP' (Devis Proforma) détectés dans la base SQL Server.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && pagination.totalPages > 0 && (
            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-medium text-slate-500">
                Affichage de <span className="font-black text-slate-950">{devis.length}</span> sur{' '}
                <span className="font-black text-slate-950">{pagination.total}</span> devis
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`inline-flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-black transition-all ${
                          pagination.page === pageNum
                            ? 'bg-[#0052CC] text-white shadow-[0_16px_36px_rgba(0,82,204,0.25)]'
                            : 'border border-slate-200 bg-white text-slate-600 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRightIcon size={20} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default DevisList
