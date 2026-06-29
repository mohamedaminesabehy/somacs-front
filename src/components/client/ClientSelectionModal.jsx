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
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  Hash,
  Users
} from 'lucide-react'

function getClientModalTitle(view, editingClient) {
  if (view === 'list') return 'Sélectionner un Client'
  return editingClient ? 'Modifier le Client' : 'Ajouter un Nouveau Client'
}

function getClientModalSubtitle(view) {
  return view === 'list' ? 'Gestion de la base de données clients' : 'Informations détaillées du client'
}

const ClientSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const [view, setView] = useState('list') // 'list' or 'form'
  const [editingClient, setEditingClient] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Mock data for clients
  const [clients, setClients] = useState([])

  const fetchClients = async () => {
    try {
      const response = await apiFetch('/clients', { auth: true })
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchClients()
    }
  }, [isOpen])

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'Homme',
    zone: '',
    priceCategory: 'A',
    phone: '',
    phone2: '',
    phone3: '',
    email: '',
    fax: '',
    taxId: '',
    web: '',
    city: ''
  })

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentClients = filteredClients.slice(startIndex, startIndex + itemsPerPage)

  const handleAddClient = () => {
    setEditingClient(null)
    setFormData({
      code: `CLT-2026-00${clients.length + 1}`,
      name: '',
      type: 'Homme',
      zone: '',
      priceCategory: 'A',
      phone: '',
      phone2: '',
      phone3: '',
      email: '',
      fax: '',
      taxId: '',
      web: '',
      city: ''
    })
    setView('form')
  }

  const handleEditClient = (client) => {
    setEditingClient(client)
    setFormData(client)
    setView('form')
  }

  const handleDeleteClient = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        const response = await apiFetch(`/clients/${id}`, {
          method: 'DELETE',
            auth: true,
        })
        if (response.ok) {
          fetchClients()
        }
      } catch (error) {
        console.error('Error deleting client:', error)
      }
    }
  }

  const handleSelectClient = (client) => {
    onSelect(client)
    onClose()
  }

  const handleSaveClient = async (e) => {
    e.preventDefault()
    try {
      const response = await apiFetch(
        editingClient ? `/clients/${editingClient.id}` : '/clients',
        {
          method: editingClient ? 'PATCH' : 'POST',
          body: formData,
          auth: true,
        },
      )
      if (response.ok) {
        fetchClients()
        setView('list')
      }
    } catch (error) {
      console.error('Error saving client:', error)
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
      <div className="relative bg-white w-full max-w-5xl h-[90vh] sm:h-[85vh] rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        
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
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${view === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
              {view === 'list' ? <Users size={20} className="sm:w-6 sm:h-6" /> : <User size={20} className="sm:w-6 sm:h-6" />}
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                {getClientModalTitle(view, editingClient)}
              </h3>
              <p className="hidden sm:block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {getClientModalSubtitle(view)}
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
            <div className="space-y-4 sm:space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl sm:rounded-2xl outline-none transition-all text-sm font-semibold"
                  />
                </div>
                <button 
                  onClick={handleAddClient}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-100"
                >
                  <Plus size={16} />
                  Ajouter Client
                </button>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider">Code Client</th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider">Contact</th>
                      <th className="hidden md:table-cell px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {currentClients.length > 0 ? (
                      currentClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                            <span className="text-[10px] sm:text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{client.code}</span>
                          </td>
                          <td className="px-4 py-3 sm:px-6 sm:py-4">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{client.name}</div>
                            <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-tight">{client.type}</div>
                          </td>
                          <td className="px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold text-slate-600">
                                <Phone size={10} className="text-slate-400" />
                                {client.phone}
                              </div>
                              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <Mail size={12} className="text-slate-400" />
                                {client.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                              <button 
                                onClick={() => handleEditClient(client)}
                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-orange-50 hover:text-orange-600 rounded-lg sm:rounded-xl transition-all"
                                title="Modifier"
                              >
                                <Edit2 size={14} className="sm:w-4 sm:h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteClient(client.id)}
                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg sm:rounded-xl transition-all"
                                title="Supprimer"
                              >
                                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                              </button>
                              <button 
                                onClick={() => handleSelectClient(client)}
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
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                              <Search size={24} className="sm:w-8 sm:h-8" />
                            </div>
                            <p className="text-slate-400 font-bold text-xs sm:text-sm">Aucun client trouvé</p>
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
                    Affichage de <span className="text-slate-900">{startIndex + 1}</span> à <span className="text-slate-900">{Math.min(startIndex + itemsPerPage, filteredClients.length)}</span> sur <span className="text-slate-900">{filteredClients.length}</span> clients
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
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}
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
            /* Form View */
            <form onSubmit={handleSaveClient} className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                
                {/* Section 1: Informations Générales */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  <div 
                    className="border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6"
                    style={{ backgroundColor: 'rgba(241, 241, 241, 0.5)' }}
                  >
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-100">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <User size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <h4 className="text-[11px] sm:text-sm font-black text-slate-800 uppercase tracking-wider">Informations Générales</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Code Client</label>
                        <div className="relative">
                          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:w-4 sm:h-4" size={14} />
                          <input 
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleInputChange}
                            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold shadow-sm placeholder:font-normal"
                            placeholder="Générer ou saisir..."
                            required
                          />
                        </div>
                        <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold italic ml-2">Code modifiable manuellement.</p>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Type de Client</label>
                        <div className="relative">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:w-4 sm:h-4" size={14} />
                          <select 
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold appearance-none cursor-pointer shadow-sm"
                          >
                            <option value="Homme">Homme</option>
                            <option value="Femme">Femme</option>
                            <option value="Personne morale">Personne morale</option>
                            <option value="Famille">Famille</option>
                          </select>
                          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 sm:w-4 sm:h-4" size={14} />
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Nom / Raison Sociale</label>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:w-4 sm:h-4" size={14} />
                          <input 
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold shadow-sm placeholder:font-normal"
                            placeholder="Nom complet ou entreprise"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Contact */}
                  <div 
                    className="border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6"
                    style={{ backgroundColor: 'rgba(241, 241, 241, 0.5)' }}
                  >
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-100">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <Phone size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <h4 className="text-[11px] sm:text-sm font-black text-slate-800 uppercase tracking-wider">Coordonnées de Contact</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Téléphone Principal</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:w-4 sm:h-4" size={14} />
                          <input 
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold shadow-sm"
                            placeholder="+216 -- --- ---"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Professionnel</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:w-4 sm:h-4" size={14} />
                          <input 
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold shadow-sm"
                            placeholder="contact@exemple.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Téléphone 2 (Optionnel)</label>
                        <input 
                          type="tel"
                          name="phone2"
                          value={formData.phone2}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold shadow-sm"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Téléphone 3 (Optionnel)</label>
                        <input 
                          type="tel"
                          name="phone3"
                          value={formData.phone3}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Column: Localisation & Fiscal */}
                <div className="space-y-4 sm:space-y-6">
                  <div 
                    className="border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-slate-800 space-y-4 sm:space-y-6 shadow-sm"
                    style={{ backgroundColor: 'rgba(241, 241, 241, 0.5)' }}
                  >
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-200">
                      <MapPin size={18} className="text-blue-600 sm:w-5 sm:h-5" />
                      <h4 className="text-[11px] sm:text-sm font-black uppercase tracking-wider text-slate-700">Localisation</h4>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Ville</label>
                        <input 
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all text-xs sm:text-sm font-bold placeholder:text-slate-300"
                          placeholder="Ex: Tunis"
                          required
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Zone / Quartier</label>
                        <input 
                          type="text"
                          name="zone"
                          value={formData.zone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all text-xs sm:text-sm font-bold placeholder:text-slate-300"
                          placeholder="Ex: Centre Ville"
                        />
                      </div>
                    </div>
                  </div>

                  <div 
                    className="border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-slate-800 space-y-4 sm:space-y-6 shadow-sm"
                    style={{ backgroundColor: 'rgba(241, 241, 241, 0.5)' }}
                  >
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-200">
                      <FileText size={18} className="text-blue-600 sm:w-5 sm:h-5" />
                      <h4 className="text-[11px] sm:text-sm font-black uppercase tracking-wider text-slate-700">Fiscalité & Web</h4>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Matricule Fiscale</label>
                        <input 
                          type="text"
                          name="taxId"
                          value={formData.taxId}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all text-xs sm:text-sm font-bold placeholder:text-slate-300"
                          placeholder="0000000/A/P/000"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Site Web</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input 
                            type="url"
                            name="web"
                            value={formData.web}
                            onChange={handleInputChange}
                            className="w-full pl-9 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all text-xs sm:text-sm font-bold placeholder:text-slate-300"
                            placeholder="www.site.tn"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Catégorie Prix</label>
                        <select 
                          name="priceCategory"
                          value={formData.priceCategory}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all text-xs sm:text-sm font-bold appearance-none cursor-pointer"
                        >
                          <option value="A" className="text-slate-900">Catégorie A</option>
                          <option value="B" className="text-slate-900">Catégorie B</option>
                          <option value="C" className="text-slate-900">Catégorie C</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions Footer */}
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
                  className="w-full sm:w-auto px-10 py-3.5 sm:py-4 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-blue-100 hover:bg-blue-700 order-1 sm:order-2"
                >
                  {editingClient ? 'Mettre à jour' : 'Enregistrer le Client'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClientSelectionModal
