import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  ClipboardList,
  Wrench,
  CheckCircle2,
  Building2,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Link2,
  AlertCircle,
  Hourglass,
  UserCheck,
  Users,
  Paperclip,
  Zap,
  Settings,
  ArrowRight,
  Target,
  Send,
  Loader2,
  Truck,
} from 'lucide-react'
import {
  INTERVENTION_STATUS_BADGE as statusColors,
} from '../../utils/intervention'
import { getStepTextColor, getStepTitleColor, getStepDescColor } from '../../utils/stepStyles'
import { useAssignMissionData } from './hooks/useAssignMissionData'
import { useAssignMissionForm } from './hooks/useAssignMissionForm'

// -- Priority config -----------------------------------------------------------
const priorityConfig = {
  Critique: { color: 'bg-red-50 border-red-400 text-red-700', dot: 'bg-red-500', label: 'Critique' },
  Haute: { color: 'bg-orange-50 border-orange-400 text-orange-700', dot: 'bg-orange-500', label: 'Haute' },
  Moyenne: { color: 'bg-blue-50 border-blue-400 text-blue-700', dot: 'bg-blue-500', label: 'Moyenne' },
  Basse: { color: 'bg-slate-50 border-slate-300 text-slate-600', dot: 'bg-slate-400', label: 'Basse' },
}

// -- Steps definition ----------------------------------------------------------
const steps = [
  { id: 1, title: 'Type',        description: 'Nature de la mission', icon: Target },
  { id: 2, title: 'Details',     description: 'Contenu & lieu',       icon: ClipboardList },
  { id: 3, title: 'Affectation', description: 'Technicien & delai',   icon: Users },
  { id: 4, title: 'Validation',  description: 'Confirmation',          icon: CheckCircle2 },
]

function getEmployeeAvailabilityLabel(active) {
  if (active === 0) return 'Disponible'
  const plural = active > 1 ? 's' : ''
  return `${active} mission${plural} active${plural}`
}

function getStepLabel(step) {
  if (step === 2) return 'Details'
  if (step === 3) return 'Affectation'
  return 'Validation'
}

function getEmployeeActivityColor(active) {
  if (active === 0) return 'bg-green-500'
  if (active <= 1) return 'bg-yellow-400'
  return 'bg-red-400'
}

function getEmployeeActivityTextColor(active) {
  if (active === 0) return 'text-green-500'
  if (active <= 1) return 'text-yellow-500'
  return 'text-red-400'
}

function renderStepIconContent(isDone, Icon, isActive, size) {
  if (isDone) {
    const checkSize = size === 'lg' ? 20 : 14
    const strokeWidth = size === 'lg' ? 4 : 3
    return <Check size={checkSize} strokeWidth={strokeWidth} />
  }
  const iconSize = size === 'lg' ? 20 : 14
  const strokeClass = isActive ? 'stroke-[3px]' : 'stroke-[2px]'
  return <Icon size={iconSize} className={strokeClass} />
}

export default function AssignMission() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefillInterventionId = location.state?.prefillInterventionId || ''

  const { interventionsList, employeeList, availableVehicles, availableVehiclesLoading } = useAssignMissionData()

  // Filtrer uniquement les techniciens
  const techniciansList = employeeList.filter(emp => {
    const normalizedRole = String(emp.role || '').trim().toLowerCase()
    return normalizedRole === 'technicien'
  })

  const form = useAssignMissionForm({ interventionsList, employeeList: techniciansList, navigate, prefillInterventionId })

  const {
    currentStep, missionType, setMissionType, formData, handleChange,
    selectedEmployees, toggleEmployeeSelection, showMaxEmployeesPopup,
    priority, setPriority, dueDate, setDueDate, dueTime, setDueTime,
    vehicleId, setVehicleId, attachments, handlePickFiles, removeAttachment, openFilePicker,
    fileInputRef, isSubmitting, handleSubmit,
    linkableInterventions, selectedIntervention, selectedEmployeeObjs,
    canGoNext, nextStep, prevStep,
  } = form
  // -- Render step content ---------------------------------------------------
  const renderStep1 = () => (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                <Target className="text-brand-600" size={24} />
                Choisissez le type de mission
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Selectionnez si vous affectez une mission interne ou une intervention SAV liee a un dossier client.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Normal */}
              <button
                type="button"
                onClick={() => setMissionType('Normal')}
                className={`group relative flex flex-col items-start gap-4 sm:gap-5 p-5 sm:p-8 rounded-3xl border-2 text-left transition-all duration-300 ${
                  missionType === 'Normal'
                    ? 'border-brand-600 bg-brand-600/5 shadow-xl shadow-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${
                  missionType === 'Normal' ? 'bg-brand-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}>
                  <ClipboardList size={24} className="sm:hidden" />
                  <ClipboardList size={32} className="hidden sm:block" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Mission Normale</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Tache interne : maintenance preventive, inventaire, installation, formation ou rapport operationnel.
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['Maintenance', 'Inventaire', 'Formation', 'Rapport'].map((tag) => (
                    <span key={tag} className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg tracking-wider ${
                      missionType === 'Normal' ? 'bg-brand-600/10 text-brand-600' : 'bg-slate-100 text-slate-400'
                    }`}>{tag}</span>
                  ))}
                </div>
                {missionType === 'Normal' && (
                  <div className="absolute top-5 right-5 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center shadow-lg">
                    <Check size={16} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </button>

              {/* Intervention SAV */}
              <button
                type="button"
                onClick={() => setMissionType('Intervention')}
                className={`group relative flex flex-col items-start gap-4 sm:gap-5 p-5 sm:p-8 rounded-3xl border-2 text-left transition-all duration-300 ${
                  missionType === 'Intervention'
                    ? 'border-brand-600 bg-brand-600/5 shadow-xl shadow-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${
                  missionType === 'Intervention' ? 'bg-brand-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}>
                  <Wrench size={24} className="sm:hidden" />
                  <Wrench size={32} className="hidden sm:block" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Intervention SAV</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Liee a un dossier d'intervention existant. Affecte automatiquement un technicien au dossier client.
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['SAV', 'Reparation', 'Garantie', 'Installation'].map((tag) => (
                    <span key={tag} className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg tracking-wider ${
                      missionType === 'Intervention' ? 'bg-brand-600/10 text-brand-600' : 'bg-slate-100 text-slate-400'
                    }`}>{tag}</span>
                  ))}
                </div>
                {missionType === 'Intervention' && (
                  <div className="absolute top-5 right-5 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center shadow-lg">
                    <Check size={16} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            </div>

            {/* Info banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Zap size={20} className="text-amber-500 fill-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 mb-1">Comment ca fonctionne ?</p>
                <ul className="text-xs font-medium text-slate-500 space-y-1 list-none">
                  <li className="flex items-center gap-2"><ArrowRight size={12} className="text-brand-600" /> <strong>Mission Normale</strong> • tache libre affectee directement a un technicien.</li>
                  <li className="flex items-center gap-2"><ArrowRight size={12} className="text-brand-600" /> <strong>Intervention SAV</strong> • lie la mission a un dossier. Le statut du dossier passe automatiquement a "Affectee".</li>
                </ul>
              </div>
            </div>
          </div>
  )

  const renderStep2 = () => (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                {missionType === 'Normal'
                  ? <><ClipboardList className="text-brand-600" size={24} /> Details de la mission</>
                  : <><Wrench className="text-brand-600" size={24} /> Details de l'intervention SAV</>
                }
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {missionType === 'Normal'
                  ? 'Renseignez le contenu, le site et les informations operationnelles.'
                  : "Selectionnez le dossier d'intervention a lier et precisez la tache."}
              </p>
            </div>

            {/* -- INTERVENTION SAV: dossier selector -- */}
            {missionType === 'Intervention' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <Link2 size={14} className="text-brand-600" />
                    Lier a un dossier d'intervention
                  </label>
                  <select
                    name="interventionId"
                    value={formData.interventionId}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 outline-none transition-all font-semibold text-slate-700 appearance-none cursor-pointer shadow-sm hover:border-slate-300"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="">-- Selectionner un dossier --</option>
                    <optgroup label="En attente (non assignees)">
                      {linkableInterventions.filter((i) => i.status === 'PENDING').map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.id} • {inv.client} • {inv.machine}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Intervention details card */}
                {selectedIntervention && (
                  <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border-2 border-blue-100 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-brand-600 bg-blue-100 px-3 py-1.5 rounded-xl">
                          {selectedIntervention.id}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{selectedIntervention.type}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${statusColors[selectedIntervention.status] || ''}`}>
                        {selectedIntervention.status === 'PENDING' && <Hourglass size={12} />}
                        {selectedIntervention.status === 'ASSIGNED' && <UserCheck size={12} />}
                        {selectedIntervention.statusLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Client</p>
                        <p className="text-sm font-bold text-slate-900">{selectedIntervention.client}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{selectedIntervention.clientCode}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Equipement</p>
                        <p className="text-sm font-bold text-slate-900">{selectedIntervention.machine}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Telephone</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          <Phone size={13} className="text-blue-300" />
                          {selectedIntervention.phone}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Site</p>
                        <p className="text-sm font-medium text-slate-700">{selectedIntervention.site || '—'}</p>
                        <p className="text-xs text-slate-600 mt-1 break-words">{selectedIntervention.address || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Date creation</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          <Calendar size={13} className="text-blue-300" />
                          {selectedIntervention.date}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Demande / Probleme</p>
                        <p className="text-sm text-slate-700 bg-white/60 p-3 rounded-xl border border-blue-50 italic leading-relaxed">
                          "{selectedIntervention.request}"
                        </p>
                      </div>
                      {selectedIntervention.assignedTo && (
                        <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center text-[10px] font-black">
                            {selectedIntervention.assignedTo.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase">Deja affectee a</p>
                            <p className="text-xs font-bold text-slate-700">{selectedIntervention.assignedTo}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* -- COMMON fields -- */}
            <div className="space-y-6">
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-brand-600 transition-colors">
                  <span className="w-2 h-2 bg-brand-600 rounded-full"></span>
                  {missionType === 'Normal' ? 'Titre de la mission' : 'Titre de la sous-mission SAV'}
                </label>
                <div className="relative">
                  <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder={missionType === 'Normal' ? 'Ex: Maintenance preventive groupe electrogene...' : 'Ex: Remplacement verin hydraulique...'}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 outline-none transition-all text-slate-800 font-semibold shadow-sm hover:border-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-brand-600 transition-colors">
                  <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                  Description / Instructions techniques
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Decrivez precisement les actions a realiser, les outils necessaires, les consignes de securite..."
                  className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 outline-none transition-all text-slate-800 font-medium resize-none leading-relaxed shadow-sm hover:border-slate-300"
                />
              </div>

              {/* Site fields */}
              {(missionType === 'Normal' || missionType === 'Intervention') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 group">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-brand-600 transition-colors">
                      <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                      Site
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                      <input
                        type="text"
                        name="site"
                        value={formData.site}
                        onChange={handleChange}
                        placeholder="Nom du site / client"
                        className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 outline-none transition-all text-slate-800 font-semibold shadow-sm hover:border-slate-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-3 group">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-brand-600 transition-colors">
                      <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                      Adresse
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Adresse complete"
                        className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 outline-none transition-all text-slate-800 font-semibold shadow-sm hover:border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pieces jointes */}
              <div
                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-brand-600 hover:bg-blue-50/30 transition-all cursor-pointer group bg-slate-50/30"
                onClick={openFilePicker}
              >
                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/*"
                  className="sr-only"
                  id="mission-attachments"
                  onChange={handlePickFiles}
                  ref={fileInputRef}
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 group-hover:text-brand-600 transition-colors">
                    <Paperclip size={24} />
                  </div>
                  <button
                    type="button"
                    className="text-sm font-bold text-slate-500 group-hover:text-brand-600 transition-colors cursor-pointer"
                  >
                    Ajouter des pieces jointes
                  </button>
                  <p className="text-xs text-slate-400">PDF, JPG, PNG • Max 10MB</p>
                </div>
                {attachments.length > 0 && (
                  <div className="mt-4 w-full max-w-md mx-auto text-left space-y-2">
                    {attachments.map((file) => (
                      <div
                        key={`${file.name}_${file.size}_${file.lastModified}`}
                        className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-700 truncate">{file.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">
                            {Math.ceil(file.size / 1024)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeAttachment(file)
                          }}
                          className="text-[10px] font-black text-red-600 hover:text-red-700"
                        >
                          Retirer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
  )

  const renderStep3 = () => (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                <Users className="text-brand-600" size={24} />
                Affectation du technicien
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Selectionnez le technicien, definissez la priorite et le planning de la mission.
              </p>
            </div>

            {/* Employee grid */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <User size={14} className="text-brand-600" />
                Choisir les techniciens (max 3)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {techniciansList.map((emp) => {
                  const isSelected = selectedEmployees.includes(emp.name)
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleEmployeeSelection(emp.name)}
                      className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-brand-600 bg-brand-600/5 shadow-lg shadow-blue-100'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                          isSelected ? 'bg-brand-600 text-white' : 'bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500'
                        }`}>
                          {emp.avatar}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          getEmployeeActivityColor(emp.active)
                        }`} title={`${emp.active} mission(s) en cours`}></div>
                      </div>
                      <div className="overflow-hidden">
                        <p className={`text-sm font-black truncate ${isSelected ? 'text-brand-600' : 'text-slate-900'}`}>{emp.name}</p>
                        <p className="text-[11px] font-semibold text-slate-400 truncate">{emp.role}</p>
                        <p className={`text-[10px] font-bold mt-0.5 ${
                          getEmployeeActivityTextColor(emp.active)
                        }`}>
                          {getEmployeeAvailabilityLabel(emp.active)}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center shadow-md">
                          <Check size={13} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <AlertCircle size={14} className="text-orange-500" />
                Priorite
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(priorityConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPriority(key)}
                    className={`relative flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all duration-200 ${
                      priority === key ? cfg.color + ' shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${priority === key ? cfg.dot : 'bg-slate-200'}`}></div>
                    <span className={`text-xs font-black ${priority === key ? '' : 'text-slate-500'}`}>{cfg.label}</span>
                    {priority === key && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-current rounded-full flex items-center justify-center opacity-30">
                        <Check size={10} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-brand-600 transition-colors">
                  <Calendar size={14} className="text-brand-600" />
                  Date de mission
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full px-5 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 outline-none transition-all font-bold text-slate-700 shadow-sm hover:border-slate-300"
                />
              </div>
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-brand-600 transition-colors">
                  <Clock size={14} className="text-brand-600" />
                  Heure de debut
                </label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 outline-none transition-all font-bold text-slate-700 shadow-sm hover:border-slate-300"
                />
              </div>
            </div>

            {/* Vehicule */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Settings size={14} className="text-brand-600" />
                Vehicule affecte (optionnel)
              </label>
              {availableVehiclesLoading ? (
                <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-500">
                  <Loader2 size={16} className="text-slate-400 shrink-0 animate-spin" />
                  Chargement des vehicules disponibles...
                </div>
              ) : availableVehicles.length === 0 ? (
                <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-500">
                  <AlertCircle size={16} className="text-slate-400 shrink-0" />
                  Aucun vehicule disponible actuellement
                </div>
              ) : (
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  disabled={selectedEmployees.length > 1}
                  className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 outline-none transition-all font-semibold text-slate-700 appearance-none cursor-pointer shadow-sm hover:border-slate-300"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                  <option value="">-- Aucun vehicule --</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.matricule} • {v.marque} {v.modele}
                    </option>
                  ))}
                </select>
              )}
              {selectedEmployees.length > 1 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
                  <AlertCircle size={13} className="shrink-0" />
                  Le vehicule est desactive pour une affectation multi-techniciens.
                </div>
              )}
              {vehicleId && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-700">
                  <Truck size={13} />
                  Vehicule selectionne • deviendra « Affecte » apres confirmation
                </div>
              )}
            </div>
          </div>
  )

  const renderStep4 = () => (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
              <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                    <CheckCircle2 size={22} className="sm:hidden" />
                    <CheckCircle2 size={28} className="hidden sm:block" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">Confirmation & validation</h2>
                  <p className="text-sm text-slate-500 font-medium">Verifiez les informations avant de confirmer l'affectation.</p>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Type & Mission */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-200">
                  {missionType === 'Normal' ? <ClipboardList className="text-brand-600" size={22} /> : <Wrench className="text-brand-600" size={22} />}
                  <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                    {missionType === 'Normal' ? 'Mission Normale' : 'Intervention SAV'}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Titre</p>
                    <p className="text-sm font-bold text-slate-900">{formData.title || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Description</p>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">{formData.description || '—'}</p>
                  </div>
                  {missionType === 'Intervention' && selectedIntervention && (
                    <div>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Dossier lie</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-brand-600 bg-blue-100 px-2.5 py-1 rounded-lg">{selectedIntervention.id}</span>
                        <span className="text-xs text-slate-600 font-semibold">{selectedIntervention.client} • {selectedIntervention.machine}</span>
                      </div>
                    </div>
                  )}
                  {missionType === 'Normal' && formData.site && (
                    <div>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Site</p>
                      <p className="text-sm font-semibold text-slate-700">{formData.site}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Technicien & planning */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border-2 border-orange-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-orange-200">
                  <Users className="text-orange-600" size={22} />
                  <span className="text-xs font-black uppercase tracking-wider text-orange-900">Technicien & Planning</span>
                </div>
                <div className="space-y-3">
                  {selectedEmployeeObjs.length > 0 && (
                    <div className="space-y-2">
                      {selectedEmployeeObjs.map((emp) => (
                        <div key={emp.id} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 text-white flex items-center justify-center font-black text-sm shadow-sm">
                            {emp.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{emp.name}</p>
                            <p className="text-xs text-slate-500 font-semibold truncate">{emp.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Priorite</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${priorityConfig[priority]?.color || ''}`}>
                        <span className={`w-2 h-2 rounded-full ${priorityConfig[priority]?.dot || ''}`}></span>
                        {priority}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Date</p>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                        <Calendar size={13} className="text-orange-300" />
                        {dueDate ? dueDate.split('-').reverse().join('/') : '—'}
                      </div>
                    </div>
                    {dueTime && (
                      <div>
                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Heure</p>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                          <Clock size={13} className="text-orange-300" />
                          {dueTime}
                        </div>
                      </div>
                    )}
                    {vehicleId && (
                      <div className="col-span-2">
                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Vehicule affecte</p>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                          <Truck size={13} className="text-orange-300" />
                          {availableVehicles.find(v => String(v.id) === String(vehicleId))
                            ? `${availableVehicles.find(v => String(v.id) === String(vehicleId)).matricule} • ${availableVehicles.find(v => String(v.id) === String(vehicleId)).marque} ${availableVehicles.find(v => String(v.id) === String(vehicleId)).modele}`
                            : '—'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow impact notice */}
            {missionType === 'Intervention' && selectedIntervention && (
              <div className="bg-gradient-to-r from-brand-600/5 to-blue-50 border-2 border-brand-600/20 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                  <AlertCircle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-brand-600 mb-1">Impact sur le dossier d'intervention</p>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    Apres confirmation, le dossier <span className="font-black text-brand-600">{selectedIntervention.id}</span> passera
                    automatiquement au statut <span className="font-black text-blue-700">"Affectee"</span> et
                    <span className="font-black text-slate-800"> {selectedEmployees.length > 0 ? selectedEmployees.join(', ') : 'le technicien selectionne'}</span> sera
                    designe comme responsable de cette intervention.
                  </p>
                </div>
              </div>
            )}

            {/* Reminder */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Zap size={18} className="text-amber-500 fill-amber-400" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Rappel</p>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed italic">
                  "Une fois confirmee, la mission sera visible dans le tableau de bord du technicien et dans la liste des missions terrain."
                </p>
              </div>
            </div>
          </div>
  )

  const stepRenderers = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
  }

  const renderStep = () => {
    const renderer = stepRenderers[currentStep]
    return renderer ? renderer() : null
  }


  // -- Main render -----------------------------------------------------------
  return (
    <div className="flex min-h-full flex-col bg-gradient-to-br from-slate-50 to-slate-100">

      {showMaxEmployeesPopup && (
        <div className="fixed top-4 right-4 z-[120]">
          <div className="bg-red-600 text-white px-5 py-3 rounded-xl shadow-2xl border border-red-700 font-black text-sm">
            Le maximum autorise est 3
          </div>
        </div>
      )}

      {/* -- TOP HEADER -- */}
      <div className="bg-white border-b-2 border-slate-200 px-4 sm:px-8 py-3 sm:py-5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <button
            onClick={() => navigate('/missions')}
            className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition-all active:scale-95 shadow-sm shrink-0"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-brand-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                <Send size={14} className="text-white sm:hidden" />
                <Send size={18} className="text-white hidden sm:block" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">Affecter une mission</h1>
                <p className="hidden sm:block text-xs text-slate-500 font-semibold">
                  {missionType === '' && 'Etape 1 sur 4 • Choisissez le type de mission'}
                  {missionType === 'Normal' && currentStep > 1 && ('Mission normale • ' + getStepLabel(currentStep))}
                  {missionType === 'Intervention' && currentStep > 1 && ('Intervention SAV • ' + getStepLabel(currentStep))}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold shrink-0">
          <span className="text-brand-600 font-black">Etape {currentStep}</span>
          <span className="text-slate-300">/</span>
          <span>{steps.length}</span>
        </div>
      </div>

      {/* -- MOBILE STEPPER (visible < md) -- */}
      <div className="md:hidden bg-white border-b border-slate-100 px-4 py-3 shrink-0">
        <div className="flex items-center max-w-xs mx-auto">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.id
            const isDone = currentStep > step.id
            const Icon = step.icon
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive ? 'bg-brand-600 text-white shadow-lg shadow-blue-200 scale-110'
                    : isDone ? 'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                  }`}>
                    {renderStepIconContent(isDone, Icon, isActive, 'sm')}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wide leading-none ${
                    getStepTextColor(isActive, isDone)
                  }`}>{step.title}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1.5 rounded-full mb-3.5 transition-all duration-500 ${
                    currentStep > step.id ? 'bg-brand-600' : 'bg-slate-100'
                  }`} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* -- BODY -- */}
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">

        {/* -- LEFT STEPPER (desktop only) -- */}
        <div className="hidden md:flex md:w-[260px] lg:w-[300px] border-r border-slate-100 bg-slate-50/30 flex-col p-6 lg:p-8 shrink-0 md:sticky md:top-0 md:self-start md:max-h-[calc(100vh-4rem)] md:overflow-y-auto">
          <div className="space-y-2 mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Etapes</h4>
            <div className="h-1 w-12 bg-brand-600 rounded-full"></div>
          </div>

          <div className="space-y-1">
            {steps.map((step) => {
              const isActive = currentStep === step.id
              const isDone = currentStep > step.id
              const Icon = step.icon
              return (
                <div key={step.id} className="relative pb-10 last:pb-0">
                  {step.id !== steps.length && (
                    <div className={`absolute left-6 top-14 bottom-0 w-0.5 rounded-full ${isDone ? 'bg-brand-600' : 'bg-slate-100'}`}></div>
                  )}
                  <div className="flex items-start gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 z-10 ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-xl shadow-blue-200 scale-110'
                        : isDone
                          ? 'bg-green-500 text-white shadow-lg shadow-green-100'
                          : 'bg-white text-slate-300 border-2 border-slate-100'
                    }`}>
                      {renderStepIconContent(isDone, Icon, isActive, 'lg')}
                    </div>
                    <div className="pt-1">
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${getStepTextColor(isActive, isDone)}`}>
                        Etape 0{step.id}
                      </p>
                      <p className={`text-base font-black tracking-tight ${getStepTitleColor(isActive, isDone)}`}>
                        {step.title}
                      </p>
                      <p className={`text-[11px] font-bold mt-0.5 ${getStepDescColor(isActive, isDone)}`}>
                        {step.description}
                      </p>
                      {isDone && <span className="text-[9px] font-black text-green-500 uppercase tracking-wider">Termine</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Type badge in sidebar */}
          {missionType && (
            <div className="mt-auto bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Type selectionne</p>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${missionType === 'Normal' ? 'bg-slate-50 border border-slate-200' : 'bg-blue-50 border border-blue-100'}`}>
                {missionType === 'Normal' ? <ClipboardList size={18} className="text-slate-500" /> : <Wrench size={18} className="text-brand-600" />}
                <div>
                  <p className={`text-sm font-black ${missionType === 'Normal' ? 'text-slate-700' : 'text-brand-600'}`}>
                    {missionType === 'Normal' ? 'Mission Normale' : 'Intervention SAV'}
                  </p>
                  {missionType === 'Intervention' && formData.interventionId && (
                    <p className="text-[10px] font-bold text-brand-600 mt-0.5">{formData.interventionId}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!missionType && (
            <div className="mt-auto bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Zap size={16} className="text-orange-400 fill-orange-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conseil</span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">
                "Affectez une Intervention SAV pour lier directement la mission a un dossier client et mettre a jour son statut automatiquement."
              </p>
            </div>
          )}
        </div>

        {/* -- CENTER FORM -- */}
        <div className="flex-1 min-h-0 bg-white flex flex-col">
          <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
            <div className="flex flex-col">
              <div>
                {renderStep()}
              </div>

              {/* Navigation buttons */}
              <div className="mt-6 sm:mt-12 pt-5 sm:pt-8 border-t-2 border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all ${
                    currentStep === 1
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 shadow-sm hover:shadow-md'
                  }`}
                >
                  <ChevronLeft size={18} />
                  Precedent
                </button>

                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canGoNext()}
                    className={`group flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl active:scale-95 ${
                      canGoNext()
                        ? 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-brand-600 hover:to-blue-700 text-white hover:shadow-blue-300 shadow-slate-300'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    Continuer
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 sm:px-12 py-3 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-green-300 active:scale-95"
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
                    <span>{isSubmitting ? 'Enregistrement...' : "Confirmer l'affectation"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
