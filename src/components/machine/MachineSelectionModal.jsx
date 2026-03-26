import React, { useState, useEffect } from 'react'
import { apiFetch } from '../../api/apiClient'
import { 
  X, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  ChevronLeft,
  ChevronRight,
  Settings,
  Cpu,
  Hash,
  Tag,
  Calendar,
  User,
  MapPin,
  Wrench,
  DollarSign,
  Activity
} from 'lucide-react'

const MachineSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const [view, setView] = useState('list') // 'list' or 'form'
  const [editingMachine, setEditingMachine] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Searchable select state for Client
  const [isClientSelectOpen, setIsClientSelectOpen] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState('')

  // Mock data for clients
  const [clients, setClients] = useState([])

  // Mock data for machines
  const [machines, setMachines] = useState([])

  const fetchMachines = async () => {
    try {
      const response = await apiFetch('/machines', { auth: false })
      if (response.ok) {
        const data = await response.json()
        setMachines(data)
      }
    } catch (error) {
      console.error('Error fetching machines:', error)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await apiFetch('/clients', { auth: false })
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
      fetchMachines()
      fetchClients()
    }
  }, [isOpen])

  const [formData, setFormData] = useState({
    code: '',
    designation: '',
    brand: '',
    serialNumber: '',
    year: '',
    client: '',
    site: '',
    service: '',
    unitAmount: ''
  })

  const filteredMachines = machines.filter(machine => 
    machine.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    machine.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    machine.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    machine.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredMachines.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentMachines = filteredMachines.slice(startIndex, startIndex + itemsPerPage)

  const handleAddMachine = () => {
    setEditingMachine(null)
    setFormData({
      code: `MAC-2026-00${machines.length + 1}`,
      designation: '',
      brand: '',
      serialNumber: '',
      year: new Date().getFullYear().toString(),
      client: '',
      site: '',
      service: '',
      unitAmount: ''
    })
    setView('form')
  }

  const handleEditMachine = (machine) => {
    setEditingMachine(machine)
    setFormData(machine)
    setView('form')
  }

  const handleDeleteMachine = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette machine ?')) {
      try {
        const response = await apiFetch(`/machines/${id}`, {
          method: 'DELETE',
          auth: false,
        })
        if (response.ok) {
          fetchMachines()
        }
      } catch (error) {
        console.error('Error deleting machine:', error)
      }
    }
  }

  const handleSelectMachine = (machine) => {
    onSelect(machine)
    onClose()
  }

  const handleSaveMachine = async (e) => {
    e.preventDefault()
    try {
      const response = await apiFetch(
        editingMachine ? `/machines/${editingMachine.id}` : '/machines',
        {
          method: editingMachine ? 'PATCH' : 'POST',
          body: formData,
          auth: false,
        },
      )
      if (response.ok) {
        fetchMachines()
        setView('list')
      }
    } catch (error) {
      console.error('Error saving machine:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const filteredClientsForSelect = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
  )

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
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${view === 'list' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
              {view === 'list' ? <Settings size={20} className="sm:w-6 sm:h-6" /> : <Cpu size={20} className="sm:w-6 sm:h-6" />}
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                {view === 'list' ? 'Sélectionner une Machine' : editingMachine ? 'Modifier la Machine' : 'Ajouter une Nouvelle Machine'}
              </h3>
              <p className="hidden sm:block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {view === 'list' ? 'Gestion du parc machines et fiches techniques' : 'Informations détaillées de l\'équipement'}
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
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl sm:rounded-2xl outline-none transition-all text-sm font-semibold"
                  />
                </div>
                <button 
                  onClick={handleAddMachine}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-100"
                >
                  <Plus size={16} />
                  Ajouter Machine
                </button>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider">Machine (Code)</th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider">Désignation</th>
                      <th className="hidden lg:table-cell px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider">Marque / Série</th>
                      <th className="hidden md:table-cell px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider">Client / Site</th>
                      <th className="hidden sm:table-cell px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider text-center">Année</th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {currentMachines.length > 0 ? (
                      currentMachines.map((machine) => (
                        <tr key={machine.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                            <span className="text-[10px] sm:text-xs font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">{machine.code}</span>
                          </td>
                          <td className="px-4 py-3 sm:px-6 sm:py-4">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{machine.designation}</div>
                            <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-tight">{machine.service}</div>
                          </td>
                          <td className="hidden lg:table-cell px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-slate-700">
                                <Tag size={10} className="text-slate-400" />
                                {machine.brand}
                              </div>
                              <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-mono font-bold text-slate-500">
                                <Hash size={10} className="text-slate-300" />
                                {machine.serialNumber}
                              </div>
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-slate-700">
                                <User size={10} className="text-slate-400" />
                                {machine.client}
                              </div>
                              <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <MapPin size={10} className="text-slate-300" />
                                {machine.site}
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 sm:px-6 sm:py-4 text-center">
                            <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-slate-700">
                              <Calendar size={12} className="text-slate-400" />
                              {machine.year}
                            </div>
                          </td>
                          <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                              <button 
                                onClick={() => handleEditMachine(machine)}
                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg sm:rounded-xl transition-all"
                                title="Modifier"
                              >
                                <Edit2 size={14} className="sm:w-4 sm:h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteMachine(machine.id)}
                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg sm:rounded-xl transition-all"
                                title="Supprimer"
                              >
                                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                              </button>
                              <button 
                                onClick={() => handleSelectMachine(machine)}
                                className="h-8 sm:h-9 px-4 sm:px-6 flex items-center justify-center bg-slate-900 text-white hover:bg-orange-600 rounded-lg sm:rounded-xl transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-center"
                              >
                                Sélectionner
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                              <Search size={24} className="sm:w-8 sm:h-8" />
                            </div>
                            <p className="text-slate-400 font-bold text-xs sm:text-sm">Aucune machine trouvée</p>
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
                    Affichage de <span className="text-slate-900">{startIndex + 1}</span> à <span className="text-slate-900">{Math.min(startIndex + itemsPerPage, filteredMachines.length)}</span> sur <span className="text-slate-900">{filteredMachines.length}</span> machines
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
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}
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
            <form onSubmit={handleSaveMachine} className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                
                {/* Section 1: Identité de la Machine */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  <div 
                    className="border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6"
                    style={{ backgroundColor: 'rgba(241, 241, 241, 0.5)' }}
                  >
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-100">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                        <Cpu size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <h4 className="text-[11px] sm:text-sm font-black text-slate-800 uppercase tracking-wider">Identité de l'Équipement</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Code Machine</label>
                        <div className="relative">
                          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:w-4 sm:h-4" size={14} />
                          <input 
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleInputChange}
                            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-orange-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold shadow-sm"
                            placeholder="Généré ou saisi..."
                          />
                        </div>
                        <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold italic ml-2">Code modifiable manuellement.</p>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Année de Fabrication</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:w-4 sm:h-4" size={14} />
                          <input 
                            type="text"
                            name="year"
                            value={formData.year}
                            onChange={handleInputChange}
                            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-orange-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold shadow-sm"
                            placeholder="Ex: 2024"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Désignation / Nom</label>
                        <div className="relative">
                          <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:w-4 sm:h-4" size={14} />
                          <input 
                            type="text"
                            name="designation"
                            value={formData.designation}
                            onChange={handleInputChange}
                            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-orange-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold shadow-sm"
                            placeholder="Ex: Pont Élévateur 4 Colonnes"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Marque</label>
                        <div className="relative">
                          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:w-4 sm:h-4" size={14} />
                          <input 
                            type="text"
                            name="brand"
                            value={formData.brand}
                            onChange={handleInputChange}
                            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-orange-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold shadow-sm"
                            placeholder="Ex: Ravaglioli"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Numéro de Série</label>
                        <div className="relative">
                          <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:w-4 sm:h-4" size={14} />
                          <input 
                            type="text"
                            name="serialNumber"
                            value={formData.serialNumber}
                            onChange={handleInputChange}
                            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-orange-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold font-mono shadow-sm"
                            placeholder="SN-XXXXXXXXX"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Affectation & Service */}
                  <div 
                    className="border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6"
                    style={{ backgroundColor: 'rgba(241, 241, 241, 0.5)' }}
                  >
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-100">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                        <Wrench size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <h4 className="text-[11px] sm:text-sm font-black text-slate-800 uppercase tracking-wider">Affectation & Service</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Service / Département</label>
                        <div className="relative">
                          <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:w-4 sm:h-4" size={14} />
                          <input 
                            type="text"
                            name="service"
                            value={formData.service}
                            onChange={handleInputChange}
                            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-orange-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold shadow-sm"
                            placeholder="Ex: SAV, Maintenance, Installation..."
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Montant Unitaire (HT)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:w-4 sm:h-4" size={14} />
                          <input 
                            type="text"
                            name="unitAmount"
                            value={formData.unitAmount}
                            onChange={handleInputChange}
                            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border-2 border-slate-100 focus:border-orange-500 rounded-xl sm:rounded-2xl outline-none transition-all text-xs sm:text-sm font-bold shadow-sm"
                            placeholder="0.000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Column: Client & Site */}
                <div className="space-y-4 sm:space-y-6">
                  <div 
                    className="border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-slate-800 space-y-4 sm:space-y-6 shadow-sm"
                    style={{ backgroundColor: 'rgba(241, 241, 241, 0.5)' }}
                  >
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-200">
                      <User size={18} className="text-orange-600 sm:w-5 sm:h-5" />
                      <h4 className="text-[11px] sm:text-sm font-black uppercase tracking-wider text-slate-700">Propriétaire</h4>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-1.5 sm:space-y-2 relative">
                        <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Client</label>
                        <div className="relative">
                          <input 
                            type="text"
                            name="client"
                            value={formData.client}
                            onChange={(e) => {
                              handleInputChange(e)
                              setClientSearchQuery(e.target.value)
                              setIsClientSelectOpen(true)
                            }}
                            onFocus={() => {
                              setIsClientSelectOpen(true)
                              setClientSearchQuery(formData.client)
                            }}
                            className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-200 focus:border-orange-500 rounded-xl outline-none transition-all text-xs sm:text-sm font-bold placeholder:text-slate-300"
                            placeholder="Rechercher un client..."
                            autoComplete="off"
                          />
                          <ChevronRight className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-200 sm:w-4 sm:h-4 ${isClientSelectOpen ? 'rotate-90' : ''}`} size={14} />
                        </div>

                        {/* Searchable Select Dropdown */}
                        {isClientSelectOpen && (
                          <div className="absolute z-[160] left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 max-h-[240px] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-2 space-y-1">
                              {filteredClientsForSelect.length > 0 ? (
                                filteredClientsForSelect.map((client) => (
                                  <button
                                    key={client.id}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, client: client.name }))
                                      setIsClientSelectOpen(false)
                                      setClientSearchQuery('')
                                    }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-orange-50 rounded-xl transition-all group"
                                  >
                                    <div className="text-sm font-bold text-slate-700 group-hover:text-orange-600 transition-colors">
                                      {client.name}
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-6 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                  Aucun client trouvé
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Overlay to close select when clicking outside */}
                        {isClientSelectOpen && (
                          <div 
                            className="fixed inset-0 z-[155]" 
                            onClick={() => setIsClientSelectOpen(false)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div 
                    className="border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-slate-800 space-y-4 sm:space-y-6 shadow-sm"
                    style={{ backgroundColor: 'rgba(241, 241, 241, 0.5)' }}
                  >
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-200">
                      <MapPin size={18} className="text-orange-400 sm:w-5 sm:h-5" />
                      <h4 className="text-[11px] sm:text-sm font-black uppercase tracking-wider text-slate-700">Localisation Site</h4>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Site / Localisation</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input 
                            type="text"
                            name="site"
                            value={formData.site}
                            onChange={handleInputChange}
                            className="w-full pl-9 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 focus:border-orange-500 rounded-xl outline-none transition-all text-xs sm:text-sm font-bold placeholder:text-slate-300"
                            placeholder="Ex: Tunis Centre"
                          />
                        </div>
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
                  className="w-full sm:w-auto px-10 py-3.5 sm:py-4 bg-orange-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-orange-100 hover:bg-orange-700 order-1 sm:order-2"
                >
                  {editingMachine ? 'Mettre à jour' : 'Enregistrer la Machine'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default MachineSelectionModal
