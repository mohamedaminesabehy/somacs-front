
import React, { useState, useEffect } from 'react'
import { apiFetch } from '../../api/apiClient'
import {
  X,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'

const getPrimaryColorClasses = (color) => {
  const classes = {
    blue: {
      bg: 'bg-blue-600',
      bgHover: 'hover:bg-blue-700',
      bgLight: 'bg-blue-50',
      text: 'text-blue-600',
      textHover: 'hover:text-blue-600',
      borderFocus: 'focus:border-blue-500',
      shadow: 'shadow-blue-100'
    },
    green: {
      bg: 'bg-green-600',
      bgHover: 'hover:bg-green-700',
      bgLight: 'bg-green-50',
      text: 'text-green-600',
      textHover: 'hover:text-green-600',
      borderFocus: 'focus:border-green-500',
      shadow: 'shadow-green-100'
    },
    purple: {
      bg: 'bg-purple-600',
      bgHover: 'hover:bg-purple-700',
      bgLight: 'bg-purple-50',
      text: 'text-purple-600',
      textHover: 'hover:text-purple-600',
      borderFocus: 'focus:border-purple-500',
      shadow: 'shadow-purple-100'
    },
    indigo: {
      bg: 'bg-indigo-600',
      bgHover: 'hover:bg-indigo-700',
      bgLight: 'bg-indigo-50',
      text: 'text-indigo-600',
      textHover: 'hover:text-indigo-600',
      borderFocus: 'focus:border-indigo-500',
      shadow: 'shadow-indigo-100'
    },
    teal: {
      bg: 'bg-teal-600',
      bgHover: 'hover:bg-teal-700',
      bgLight: 'bg-teal-50',
      text: 'text-teal-600',
      textHover: 'hover:text-teal-600',
      borderFocus: 'focus:border-teal-500',
      shadow: 'shadow-teal-100'
    }
  }
  return classes[color] || classes.blue
}

function SearchBar({ searchQuery, setSearchQuery, primaryColor, placeholder = 'Rechercher...' }) {
  const colorClasses = getPrimaryColorClasses(primaryColor)
  return (
    <div className="relative flex-1">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border-2 border-transparent ${colorClasses.borderFocus} focus:bg-white rounded-xl sm:rounded-2xl outline-none transition-all text-sm font-semibold`}
      />
    </div>
  )
}

function EmptyState({ emptyMessage }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
        <Search size={24} className="sm:w-8 sm:h-8" />
      </div>
      <p className="text-slate-400 font-bold text-xs sm:text-sm">{emptyMessage}</p>
    </div>
  )
}

function Pagination({
  totalPages,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  startIndex,
  totalItems,
  entityName,
  primaryColor
}) {
  if (totalPages <= 1) return null

  const colorClasses = getPrimaryColorClasses(primaryColor)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
      <p className="text-[10px] sm:text-xs font-bold text-slate-400 order-2 sm:order-1">
        Affichage de <span className="text-slate-900">{startIndex + 1}</span> à <span className="text-slate-900">{Math.min(startIndex + itemsPerPage, totalItems)}</span> sur <span className="text-slate-900">{totalItems}</span> {entityName}s
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
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all ${currentPage === i + 1 ? `${colorClasses.bg} text-white shadow-lg ${colorClasses.shadow}` : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}
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
  )
}

function EntityRowActions({
  entity,
  primaryColor,
  onEdit,
  onDelete,
  onSelect
}) {
  const colorClasses = getPrimaryColorClasses(primaryColor)
  return (
    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
      <button
        onClick={() => onEdit(entity)}
        className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:${colorClasses.bgLight} ${colorClasses.textHover} rounded-lg sm:rounded-xl transition-all`}
        title="Modifier"
      >
        <Edit2 size={14} className="sm:w-4 sm:h-4" />
      </button>
      <button
        onClick={() => onDelete(entity.id)}
        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg sm:rounded-xl transition-all"
        title="Supprimer"
      >
        <Trash2 size={14} className="sm:w-4 sm:h-4" />
      </button>
      <button
        onClick={() => onSelect(entity)}
        className="h-8 sm:h-9 px-4 sm:px-6 flex items-center justify-center bg-slate-900 text-white hover:bg-blue-600 rounded-lg sm:rounded-xl transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-center"
      >
        Sélectionner
      </button>
    </div>
  )
}

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState(initialForm)

  const colorClasses = getPrimaryColorClasses(primaryColor)

  const fetchEntities = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch(fetchEndpoint, { auth: true })
      if (response.ok) {
        const data = await response.json()
        setEntities(data)
      } else {
        throw new Error(`Erreur lors du chargement des ${entityName}s`)
      }
    } catch (error) {
      console.error(`Error fetching ${entityName}s:`, error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setView('list')
      setSearchQuery('')
      setCurrentPage(1)
      setEditingEntity(null)
      setFormData(initialForm)
      setError(null)
      fetchEntities()
    }
  }, [isOpen, fetchEndpoint, initialForm])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

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
    setFormData({ ...entity })
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
        } else {
          throw new Error(`Erreur lors de la suppression de la ${entityName}`)
        }
      } catch (error) {
        console.error(`Error deleting ${entityName}:`, error)
        setError(error.message)
      }
    }
  }

  const handleSelectEntity = (entity) => {
    onSelect(entity)
    onClose()
  }

  const handleSaveEntity = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch(
        editingEntity ? `${fetchEndpoint}/${editingEntity.id}` : fetchEndpoint,
        {
          method: editingEntity ? 'PATCH' : 'POST',
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'application/json',
          },
          auth: true,
        },
      )
      if (response.ok) {
        fetchEntities()
        setView('list')
      } else {
        throw new Error(`Erreur lors de l'enregistrement de la ${entityName}`)
      }
    } catch (error) {
      console.error(`Error saving ${entityName}:`, error)
      setError(error.message)
    } finally {
      setLoading(false)
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
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${view === 'list' ? `${colorClasses.bgLight} ${colorClasses.text}` : `bg-blue-50 text-blue-600`}`}>
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
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
          
          {view === 'list' ? (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} primaryColor={primaryColor} />
                <button
                  onClick={handleAddEntity}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 ${colorClasses.bg} ${colorClasses.bgHover} text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${colorClasses.shadow} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Plus size={16} />
                  {actions?.addLabel || `Ajouter ${entityName}`}
                </button>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl overflow-x-auto shadow-sm">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                ) : (
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
                              <EntityRowActions
                                entity={entity}
                                primaryColor={primaryColor}
                                onEdit={handleEditEntity}
                                onDelete={handleDeleteEntity}
                                onSelect={handleSelectEntity}
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                            <EmptyState emptyMessage={emptyMessage} />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {!loading && (
                <Pagination
                  totalPages={totalPages}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  startIndex={startIndex}
                  totalItems={filteredEntities.length}
                  entityName={entityName}
                  primaryColor={primaryColor}
                />
              )}
            </div>
          ) : (
            customForm ? customForm({ formData, handleInputChange, handleSaveEntity, setView, editingEntity, primaryColor, loading }) : (
              <form onSubmit={handleSaveEntity} className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-8">
                {/* Form sections would go here, but Client & Machine forms are custom */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-slate-100 mt-4 sm:mt-8">
                  <button 
                    type="button"
                    onClick={() => setView('list')}
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-red-50 text-red-600 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-red-100 order-2 sm:order-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className={`w-full sm:w-auto px-10 py-3.5 sm:py-4 ${colorClasses.bg} text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl ${colorClasses.shadow} ${colorClasses.bgHover} order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
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
