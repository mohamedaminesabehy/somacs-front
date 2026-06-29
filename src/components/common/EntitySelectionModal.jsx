
import React, { useState, useEffect } from 'react'
import { apiFetch } from '../../api/apiClient'
import {
  X,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default function EntitySelectionModal({
  isOpen,
  onClose,
  onSelect,
  entityName,
  fetchEndpoint,
  getTitle,
  getSubtitle,
  listIcon,
  formIcon,
  primaryColor,
  emptyMessage,
  columns,
  initialForm,
  resetForm,
  filterFn,
  customForm,
  formSections = [],
  actions
}) {
  const [view, setView] = useState('list') // 'list' or 'form'
  const [editingEntity, setEditingEntity] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const [entities, setEntities] = useState([])

  const fetchEntities = async () => {
    try {
      const response = await apiFetch(fetchEndpoint, { auth: true })
      if (response.ok) {
        const data = await response.json()
        setEntities(data)
      }
    } catch (error) {
      console.error(`Error fetching ${entityName}s:`, error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchEntities()
    }
  }, [isOpen, fetchEndpoint])

  const [formData, setFormData] = useState(initialForm)

  const filteredEntities = entities.filter(entity =>
    filterFn(entity, searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredEntities.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentEntities = filteredEntities.slice(startIndex, startIndex + itemsPerPage)

  const handleAddEntity = () => {
    setEditingEntity(null)
    setFormData(resetForm(entities.length))
    setView('form')
  }

  const handleEditEntity = (entity) => {
    setEditingEntity(entity)
    setFormData(entity)
    setView('form')
  }

  const handleDeleteEntity = async (id) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette ${entityName} ?`)) {
      try {
        const response = await apiFetch(`${fetchEndpoint}/${id}`, {
          method: 'DELETE',
          auth: true,
        })
        if (response.ok) {
          fetchEntities()
        }
      } catch (error) {
        console.error(`Error deleting ${entityName}:`, error)
      }
    }
  }

  const handleSelectEntity = (entity) => {
    onSelect(entity)
    onClose()
  }

  const handleSaveEntity = async (e) => {
    e.preventDefault()
    try {
      const response = await apiFetch(
        editingEntity ? `${fetchEndpoint}/${editingEntity.id}` : fetchEndpoint,
        {
          method: editingEntity ? 'PATCH' : 'POST',
          body: formData,
          auth: true,
        },
      )
      if (response.ok) {
        fetchEntities()
        setView('list')
      }
    } catch (error) {
      console.error(`Error saving ${entityName}:`, error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-6xl h-[90vh] sm:h-[85vh] rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2 sm:gap-4">
            {view === 'form' && (
              <button 
                onClick={() => setView('list')}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-90 mr-1 sm:mr-2"
                title="Retour à la liste"
              >
                <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
              </button>
            )}
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${view === 'list' ? `bg-${primaryColor}-50 text-${primaryColor}-600` : `bg-blue-50 text-blue-600`}`}>
              {view === 'list' ? listIcon : formIcon}
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                {getTitle(view, editingEntity)}
              </h3>
              <p className="hidden sm:block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {getSubtitle(view)}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100 hover:text-red-600 transition-all active:scale-90"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
          {view === 'list' ? (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border-2 border-transparent focus:border-${primaryColor}-500 focus:bg-white rounded-xl sm:rounded-2xl outline-none transition-all text-sm font-semibold`}
                  />
                </div>
                <button 
                  onClick={handleAddEntity}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-${primaryColor}-600 hover:bg-${primaryColor}-700 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-${primaryColor}-100`}
                >
                  <Plus size={16} />
                  {actions?.addLabel || `Ajouter ${entityName}`}
                </button>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      {columns.map((col, index) => (
                        <th key={index} className={`px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider ${col.className || ''}`}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {currentEntities.length > 0 ? (
                      currentEntities.map((entity) => (
                        <tr key={entity.id} className="hover:bg-slate-50/50 transition-colors group">
                          {columns.map((col, index) => (
                            <td key={index} className={`px-4 py-3 sm:px-6 sm:py-4 ${col.className || ''}`}>
                              {col.render(entity)}
                            </td>
                          ))}
                          <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                              <button 
                                onClick={() => handleEditEntity(entity)}
                                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-${primaryColor}-50 hover:text-${primaryColor}-600 rounded-lg sm:rounded-xl transition-all`}
                                title="Modifier"
                              >
                                <Edit2 size={14} className="sm:w-4 sm:h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteEntity(entity.id)}
                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg sm:rounded-xl transition-all"
                                title="Supprimer"
                              >
                                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                              </button>
                              <button 
                                onClick={() => handleSelectEntity(entity)}
                                className="h-8 sm:h-9 px-4 sm:px-6 flex items-center justify-center bg-slate-900 text-white hover:bg-blue-600 rounded-lg sm:rounded-xl transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-center"
                              >
                                Sélectionner
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                              <Search size={24} className="sm:w-8 sm:h-8" />
                            </div>
                            <p className="text-slate-400 font-bold text-xs sm:text-sm">{emptyMessage}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 order-2 sm:order-1">
                    Affichage de <span className="text-slate-900">{startIndex + 1}</span> à <span className="text-slate-900">{Math.min(startIndex + itemsPerPage, filteredEntities.length)}</span> sur <span className="text-slate-900">{filteredEntities.length}</span> {entityName}s
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2 order-1 sm:order-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all ${currentPage === i + 1 ? `bg-${primaryColor}-600 text-white shadow-lg shadow-${primaryColor}-100` : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            customForm ? customForm({ formData, handleInputChange, handleSaveEntity, setView, editingEntity, primaryColor }) : (
              <form onSubmit={handleSaveEntity} className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-8">
                {/* Form sections would go here, but Client & Machine forms are custom */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-slate-100 mt-4 sm:mt-8">
                  <button 
                    type="button"
                    onClick={() => setView('list')}
                    className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-red-50 text-red-600 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-red-100 order-2 sm:order-1"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className={`w-full sm:w-auto px-10 py-3.5 sm:py-4 bg-${primaryColor}-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-${primaryColor}-100 hover:bg-${primaryColor}-700 order-1 sm:order-2`}
                  >
                    {editingEntity ? (actions?.updateLabel || 'Mettre à jour') : (actions?.saveLabel || `Enregistrer ${entityName}`)}
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  )
}
