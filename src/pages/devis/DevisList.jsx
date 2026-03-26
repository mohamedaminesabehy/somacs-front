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
    if (item.ETATDOC === 'C') {
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

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Devis</h1>
          <p className="text-slate-500 text-sm font-medium">Consultez et gérez vos devis clients (SQL Server)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDevis}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => navigate('/devis/create')}
            className="flex items-center gap-2 bg-[#0052CC] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-[#0747A6] transition-all transform hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Nouveau Devis
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par numéro, nom ou code client..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={handleSort}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all flex-1 md:flex-none justify-center"
          >
            <Calendar size={18} />
            Trier par date création {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
          <button className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-4">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Numéro</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors" onClick={handleSort}>
                  Date de création {sortOrder === 'asc' ? '↑' : '↓'}
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client (Code & Nom)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Montant TTC</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">État</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="7" className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-lg w-full" /></td>
                  </tr>
                ))
              ) : devis.length > 0 ? (
                devis.map((item) => (
                  <tr
                    key={item.NUMERO}
                    className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${item.IsAnnuler ? 'opacity-60 bg-red-50/30' : ''}`}
                    onClick={() => navigate(`/devis/${item.NUMERO}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${item.IsAnnuler ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                          <FileText size={16} />
                        </div>
                        <span className={`font-bold ${item.IsAnnuler ? 'text-red-900 line-through' : 'text-slate-900'}`}>{item.NUMERO}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                        {item.TYPDOC}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} />
                        <span className="text-sm font-medium">{formatDate(item.DATDOC)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`font-bold ${item.IsAnnuler ? 'text-red-900/70' : 'text-slate-900'}`}>{item.NOMTIE || 'Client inconnu'}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.DESTINA || item.CODTIE}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-black ${item.IsAnnuler ? 'text-red-600' : 'text-slate-900'}`}>{formatCurrency(item.TOTTTCDV)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/devis/${item.NUMERO}`);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Eye size={18} />
                        </button>
                        {!item.IsAnnuler && (
                          <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                            <Edit2 size={18} />
                          </button>
                        )}
                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <FileText size={48} />
                      </div>
                      <p className="text-slate-500 font-medium">Aucun devis trouvé correspondant à votre recherche</p>
                      <p className="text-slate-400 text-xs italic mt-2">Note: Le système recherche les documents avec les types 'DE' (Devis) et 'DP' (Devis Proforma) détectés dans la base SQL Server.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && pagination.totalPages > 0 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500 font-medium">
              Affichage de <span className="font-bold text-slate-900">{devis.length}</span> sur <span className="font-bold text-slate-900">{pagination.total}</span> devis
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                        pagination.page === pageNum
                          ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-200'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRightIcon size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DevisList
