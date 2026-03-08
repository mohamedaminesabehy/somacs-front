import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  User, 
  Settings, 
  AlertCircle, 
  ClipboardCheck,
  Building2,
  Phone,
  MapPin,
  Cpu,
  Hash,
  FileText,
  Clock,
  Printer,
  FileSearch,
  CheckCircle2,
  ShieldCheck,
  Zap,
  QrCode,
  Calendar,
  UserCheck
} from 'lucide-react'
import logo from '../../assets/logo.jpg'

const steps = [
  { id: 1, title: 'Client', description: 'Identification', icon: User },
  { id: 2, title: 'Machine', description: 'Fiche Technique', icon: Settings },
  { id: 3, title: 'Diagnostic', description: 'Analyse initiale', icon: AlertCircle },
  { id: 4, title: 'Validation', description: 'Clôture dossier', icon: ClipboardCheck },
]

export default function CreateIntervention() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    clientName: '',
    clientCode: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    siteName: '',
    requestorName: '',
    machineType: '',
    machineBrand: '',
    machineModel: '',
    serialNumber: '',
    problemDescription: '',
    telephoneDiagnostic: '',
    interventionType: 'Réparation',
    interventionDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    totalTime: '',
    ficheNumber: '2026/02/09 122757',
    technicianName: '',
    numEssai: '',
    essaiConcluant: null,
    laborPrice: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const handleSubmit = (e) => {
    e.preventDefault()
    // After validation, the intervention is created with status "En attente" (PENDING)
    // and no assigned employee. It will appear in the intervention list.
    // An employee can then be assigned via the mission creation workflow.
    alert('✅ Dossier d\'intervention créé avec succès !\n\nStatut : En attente\nEmployé assigné : Non assigné\n\nVous pouvez maintenant créer une mission pour affecter un employé à cette intervention.')
    navigate('/interventions')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            {/* Section Title */}
            <div className="pb-6 border-b-2 border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                <Building2 className="text-[#0052CC]" size={28} />
                Informations Client
              </h2>
              <p className="text-sm text-slate-500 font-medium">Renseignez les coordonnées complètes du client et le lieu d'intervention</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <span className="w-2 h-2 bg-[#0052CC] rounded-full"></span>
                  Nom du Client
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={20} />
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    placeholder="Ex: Garage Automobile Central"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal shadow-sm hover:border-slate-300"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                  Code Client
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={20} />
                  <input
                    type="text"
                    name="clientCode"
                    value={formData.clientCode}
                    onChange={handleChange}
                    placeholder="CLT-2026-001"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal shadow-sm hover:border-slate-300"
                  />
                </div>
              </div>
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                  Demandeur
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={20} />
                  <input
                    type="text"
                    name="requestorName"
                    value={formData.requestorName}
                    onChange={handleChange}
                    placeholder="Nom du responsable ou contact"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal shadow-sm hover:border-slate-300"
                  />
                </div>
              </div>
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={20} />
                  <input
                    type="tel"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleChange}
                    placeholder="+216 XX XXX XXX"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal shadow-sm hover:border-slate-300"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                  Adresse E-mail
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={20} />
                  <input
                    type="email"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleChange}
                    placeholder="contact@exemple.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal shadow-sm hover:border-slate-300"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                  Site / Localisation
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={20} />
                  <input
                    type="text"
                    name="siteName"
                    value={formData.siteName}
                    onChange={handleChange}
                    placeholder="Ex: Usine Principale - Zone Industrielle"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal shadow-sm hover:border-slate-300"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                  Adresse Complète d'Intervention
                </label>
                <div className="relative">
                  <textarea
                    name="clientAddress"
                    value={formData.clientAddress}
                    onChange={handleChange}
                    placeholder="Saisissez l'adresse physique complète : rue, ville, code postal..."
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal h-32 resize-none shadow-sm hover:border-slate-300 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            {/* Section Title */}
            <div className="pb-6 border-b-2 border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                <Settings className="text-orange-500" size={28} />
                Fiche Technique Machine
              </h2>
              <p className="text-sm text-slate-500 font-medium">Identifiez précisément l'équipement concerné par l'intervention</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Type de Machine
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                  <input
                    type="text"
                    name="machineType"
                    value={formData.machineType}
                    onChange={handleChange}
                    placeholder="Ex: Pont Élévateur 4 Colonnes"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal shadow-sm hover:border-slate-300"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                  Marque
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="machineBrand"
                    value={formData.machineBrand}
                    onChange={handleChange}
                    placeholder="Ex: Ravaglioli, Hofmann, etc."
                    className="w-full px-5 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal shadow-sm hover:border-slate-300"
                  />
                </div>
              </div>
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                  Modèle
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="machineModel"
                    value={formData.machineModel}
                    onChange={handleChange}
                    placeholder="Ex: RAV-3000, KPH-370"
                    className="w-full px-5 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal shadow-sm hover:border-slate-300"
                  />
                </div>
              </div>
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                  <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                  Numéro de Série
                </label>
                <div className="relative">
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    placeholder="SN-123456789"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-slate-800 font-bold font-mono placeholder:text-slate-400 placeholder:font-normal tracking-wider shadow-sm hover:border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h4 className="font-black text-orange-900 text-sm mb-1">Important pour la garantie</h4>
                <p className="text-orange-800 text-xs leading-relaxed">Le numéro de série est essentiel pour vérifier la validité de la garantie constructeur et accéder à l'historique complet de maintenance.</p>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            {/* Section Title */}
            <div className="pb-6 border-b-2 border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                <AlertCircle className="text-blue-600" size={28} />
                Diagnostic & Analyse
              </h2>
              <p className="text-sm text-slate-500 font-medium">Décrivez en détail la nature de l'intervention et les problèmes constatés</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-blue-600 transition-colors">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  Type d'Intervention
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="interventionType"
                    value={formData.interventionType}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-bold text-blue-700 appearance-none cursor-pointer shadow-sm hover:border-slate-300"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="Réparation">🔧 Réparation</option>
                    <option value="Installation">⚡ Installation</option>
                    <option value="Garantie">🛡️ Sous Garantie</option>
                    <option value="Devis">📄 Établissement Devis</option>
                    <option value="Formation">🎓 Formation</option>
                    <option value="Livraison">📦 Livraison</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-blue-600 transition-colors">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  Type de panne
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    name="problemDescription"
                    value={formData.problemDescription}
                    onChange={handleChange}
                    placeholder="Décrivez précisément le type de panne : symptômes observés, bruits anormaux, codes d'erreur affichés, circonstances d'apparition du problème, etc."
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal h-32 resize-none leading-relaxed shadow-sm hover:border-slate-300"
                    required
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-semibold">
                    {formData.problemDescription.length} caractères
                  </div>
                </div>
              </div>

              {/* Guidelines Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                <h4 className="font-black text-blue-900 text-sm mb-3 flex items-center gap-2">
                  <FileText size={18} />
                  Conseils pour identifier le type de panne
                </h4>
                <ul className="space-y-2 text-blue-800 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-black">•</span>
                    <span>Mentionnez les <strong>symptômes précis</strong> : bruits, vibrations, arrêts intempestifs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-black">•</span>
                    <span>Indiquez le <strong>moment d'apparition</strong> de la panne et sa fréquence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-black">•</span>
                    <span>Notez les <strong>codes d'erreur</strong> affichés par l'équipement si disponibles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-black">•</span>
                    <span>Précisez si des <strong>interventions antérieures</strong> ont été effectuées sur cette panne</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            {/* Section Title */}
            <div className="pb-6 border-b-2 border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <ClipboardCheck size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Récapitulatif & Validation</h2>
                  <p className="text-sm text-slate-500 font-medium">Vérifiez les informations avant l'enregistrement définitif</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-200">
                    <Building2 className="text-blue-600" size={22} />
                    <span className="text-xs font-black uppercase tracking-wider text-blue-900">Informations Client</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Client</p>
                      <p className="text-sm font-bold text-slate-900">{formData.clientName || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Site</p>
                      <p className="text-xs font-semibold text-slate-700">{formData.siteName || 'Site non spécifié'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Contact</p>
                      <p className="text-xs font-semibold text-slate-600">{formData.clientPhone || 'Pas de téléphone'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border-2 border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-orange-200">
                    <Settings className="text-orange-600" size={22} />
                    <span className="text-xs font-black uppercase tracking-wider text-orange-900">Détails Machine</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">Équipement</p>
                      <p className="text-sm font-bold text-slate-900">{formData.machineType || 'Inconnu'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">Marque & Modèle</p>
                      <p className="text-xs font-semibold text-slate-700">{formData.machineBrand} {formData.machineModel}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">N° de Série</p>
                      <p className="text-xs font-mono font-bold text-slate-600 tracking-wider">{formData.serialNumber || '---'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intervention Summary */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-purple-600" size={22} />
                    <span className="text-xs font-black uppercase tracking-wider text-purple-900">Type : {formData.interventionType}</span>
                  </div>
                  <div className="px-4 py-2 bg-white rounded-xl text-[10px] font-black text-purple-700 border-2 border-purple-200 uppercase tracking-widest shadow-sm">
                    Priorité Haute
                  </div>
                </div>
                <p className="text-sm font-medium text-purple-900 leading-relaxed italic line-clamp-3 bg-white/50 p-4 rounded-xl">
                  "{formData.problemDescription || "Aucune description fournie."}"
                </p>
              </div>

              {/* Time & Technician Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3 group">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-green-600 transition-colors">
                    <Clock size={16} className="text-green-600" />
                    Heure d'entrée
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:ring-4 focus:ring-green-600/10 outline-none transition-all text-slate-800 font-bold shadow-sm hover:border-slate-300"
                  />
                </div>
                <div className="space-y-3 group">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-green-600 transition-colors">
                    <Clock size={16} className="text-green-600" />
                    Heure de sortie
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:ring-4 focus:ring-green-600/10 outline-none transition-all text-slate-800 font-bold shadow-sm hover:border-slate-300"
                  />
                </div>
                <div className="md:col-span-2 space-y-3 group">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-green-600 transition-colors">
                    <UserCheck size={16} className="text-green-600" />
                    Technicien en charge
                  </label>
                  <input
                    type="text"
                    name="technicianName"
                    value={formData.technicianName}
                    onChange={handleChange}
                    placeholder="Nom du technicien assigné à cette intervention"
                    className="w-full px-5 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:ring-4 focus:ring-green-600/10 outline-none transition-all text-slate-800 font-bold placeholder:text-slate-400 placeholder:font-normal shadow-sm hover:border-slate-300"
                  />
                </div>
              </div>

              {/* Digital Signature Area */}
              <div className="space-y-4 pt-6 border-t-2 border-slate-100">
                <div className="flex items-center gap-3">
                  <UserCheck size={20} className="text-slate-500" />
                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Signature Numérique de l'Opérateur</span>
                </div>
                <div className="h-40 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center group hover:border-green-500 hover:from-green-50 hover:to-emerald-50 transition-all cursor-pointer shadow-inner">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:bg-green-500 group-hover:scale-110 transition-all">
                      <FileText className="text-slate-400 group-hover:text-white transition-colors" size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-green-600 transition-colors">
                      Cliquez pour signer numériquement
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Zone de signature électronique</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Ultra-Modern Header */}
      <div className="bg-white border-b-2 border-slate-200 px-8 py-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/interventions')}
            className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nouvelle Intervention</h1>
              <span className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-lg shadow-blue-200">
                SAV Administration
              </span>
            </div>
            <p className="text-slate-500 text-sm font-semibold mt-1 flex items-center gap-2">
              <Calendar size={14} />
              Création et enregistrement d'un nouveau dossier d'intervention
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end text-right mr-6 pr-6 border-r-2 border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opérateur SAV</span>
            <span className="text-sm font-black text-slate-700">Service Accueil</span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{new Date().toLocaleDateString('fr-FR')}</span>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md active:scale-95">
            <Printer size={18} /> Brouillon
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation: Vertical High-End Stepper */}
        <div className="w-[320px] border-r border-slate-50 bg-slate-50/30 flex flex-col p-8 shrink-0">
          <div className="space-y-2 mb-12">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Progression</h4>
            <div className="h-1 w-12 bg-[#0052CC] rounded-full"></div>
          </div>
          
          <div className="space-y-1">
            {steps.map((step) => {
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              const Icon = step.icon
              
              return (
                <div key={step.id} className="relative pb-10 last:pb-0">
                  {step.id !== steps.length && (
                    <div className={`absolute left-6 top-14 bottom-0 w-0.5 rounded-full ${isCompleted ? 'bg-[#0052CC]' : 'bg-slate-100'}`}></div>
                  )}
                  
                  <div className="flex items-start gap-5 group cursor-default">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 z-10 ${
                      isActive 
                        ? 'bg-[#0052CC] text-white shadow-xl shadow-blue-200 scale-110' 
                        : isCompleted
                          ? 'bg-green-500 text-white shadow-lg shadow-green-100'
                          : 'bg-white text-slate-300 border-2 border-slate-50 group-hover:border-slate-200'
                    }`}>
                      {isCompleted ? <Check size={20} className="stroke-[4px]" /> : <Icon size={20} className={isActive ? 'stroke-[3px]' : 'stroke-[2px]'} />}
                    </div>
                    <div className="pt-1">
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 transition-colors ${isActive ? 'text-[#0052CC]' : 'text-slate-300'}`}>Étape 0{step.id}</p>
                      <p className={`text-base font-black tracking-tight transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</p>
                      <p className={`text-[11px] font-bold mt-0.5 transition-colors ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>{step.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-auto bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Zap size={16} className="text-orange-400 fill-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Astuce SAV</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">"Vérifiez toujours le numéro de série pour garantir la validité de la garantie constructeur."</p>
          </div>
        </div>

        {/* Middle: The Main Form */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white flex flex-col">
          <div className="flex-1 px-12 py-16 max-w-4xl mx-auto w-full">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="flex-1">
                {renderStepContent()}
              </div>

              {/* Enhanced Navigation Bar */}
              <div className="mt-12 pt-8 border-t-2 border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                    currentStep === 1 
                      ? 'text-slate-300 cursor-not-allowed' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 shadow-sm hover:shadow-md'
                  }`}
                >
                  <ChevronLeft size={20} />
                  Étape Précédente
                </button>
                
                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="group flex items-center gap-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-[#0052CC] hover:to-blue-700 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-slate-300 hover:shadow-blue-300 active:scale-95"
                  >
                    Continuer
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-green-300 active:scale-95"
                  >
                    <Check size={20} strokeWidth={3} />
                    Valider le Dossier
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: The Digital Twin (Exact Physical Form Replication) */}
        <div className="hidden xl:flex w-[620px] bg-slate-100 border-l border-slate-200 flex-col items-center justify-start overflow-y-auto no-scrollbar py-8 px-6">
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Aperçu de la fiche officielle</h4>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0052CC]"></div>
              </div>
            </div>
            
            {/* The Document — exact replica of the physical paper */}
            <div className="w-full bg-white shadow-2xl rounded-none px-7 pt-5 pb-8 relative transition-all duration-700 overflow-hidden border border-slate-300 text-slate-900 leading-none" style={{ aspectRatio: '1/1.414', fontFamily: 'Arial, Helvetica, sans-serif' }}>
              
              {/* ====== HEADER with Two Logos ====== */}
              <div className="flex justify-between items-center pb-3 mb-3" style={{ borderBottom: '1px solid #000' }}>
                <div className="w-16 h-16 shrink-0">
                  <img src={logo} alt="Logo Left" className="w-full h-full object-contain grayscale opacity-80" />
                </div>
                <div className="text-center flex-1 px-2">
                  <h2 style={{ fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 3px 0', letterSpacing: '0.02em' }}>Fiche d'intervention de S.A.V</h2>
                  <p style={{ fontSize: '10px', fontStyle: 'italic', color: '#555', margin: '0 0 2px 0' }}>Nous vous garantissons la qualité</p>
                  <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>SOMACS SERVICE S.A.R.L</p>
                </div>
                <div className="w-16 h-16 shrink-0">
                  <img src={logo} alt="Logo Right" className="w-full h-full object-contain grayscale opacity-80" />
                </div>
              </div>

              {/* ====== TOP INFO TABLE (3 rows) ====== */}
              <table className="w-full border-collapse border border-slate-900 mb-[6px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <tbody>
                  {/* Row 1 */}
                  <tr>
                    <td className="border border-slate-900 bg-slate-50 p-1 w-[22%]">
                      <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Date de l'intervention</p>
                    </td>
                    <td className="border border-slate-900 p-1 text-center w-[20%]">
                      <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.interventionDate ? formData.interventionDate.split('-').reverse().join('/') : '....../....../2026'}</span>
                    </td>
                    <td className="border border-slate-900 bg-slate-50 p-1 w-[15%]">
                      <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Heure d'entrée</p>
                    </td>
                    <td className="border border-slate-900 p-1 text-center w-[13%]">
                      <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.startTime || '........h..........'}</span>
                    </td>
                    <td className="border border-slate-900 bg-slate-50 p-1 text-center" rowSpan="3" style={{ width: '18%', verticalAlign: 'top' }}>
                      <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Prise en charge par</p>
                      <p style={{ fontSize: '9px', fontWeight: '400', marginTop: '6px' }}>{formData.technicianName || ''}</p>
                    </td>
                  </tr>
                  {/* Row 2 */}
                  <tr>
                    <td className="border border-slate-900 bg-slate-50 p-1">
                      <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Numéro de la fiche</p>
                    </td>
                    <td className="border border-slate-900 p-1 text-center">
                      <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.ficheNumber}</span>
                    </td>
                    <td className="border border-slate-900 bg-slate-50 p-1">
                      <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Heure de sortie</p>
                    </td>
                    <td className="border border-slate-900 p-1 text-center">
                      <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.endTime || '........h..........'}</span>
                    </td>
                  </tr>
                  {/* Row 3 */}
                  <tr>
                    <td className="border border-slate-900 bg-slate-50 p-1">
                      <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Site</p>
                    </td>
                    <td className="border border-slate-900 p-1 text-center">
                      <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.siteName || '..............................'}</span>
                    </td>
                    <td className="border border-slate-900 bg-slate-50 p-1">
                      <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>TOTAL</p>
                    </td>
                    <td className="border border-slate-900 p-1 text-center">
                      <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.totalTime || '..............................'}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* ====== INTERVENTION TYPE TABLE ====== */}
              <table className="w-full border-collapse border border-slate-900 mb-[6px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <thead>
                  <tr>
                    <th className="border border-slate-900 bg-slate-50 p-1 w-[22%]" rowSpan="2">
                      <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', margin: 0 }}>Type<br />d'intervention</p>
                    </th>
                    {['Devis', 'Livraison', 'Formation', 'Installation', 'Réparation', 'Garantie'].map((type) => (
                      <th key={type} className="border border-slate-900 bg-slate-50 p-1 text-center">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>{type}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-900 bg-slate-50 p-1"></td>
                    {['Devis', 'Livraison', 'Formation', 'Installation', 'Réparation', 'Garantie'].map((type) => (
                      <td key={type} className="border border-slate-900 p-1 text-center" style={{ height: '20px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700' }}>{formData.interventionType === type ? 'X' : ''}</span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* ====== MAIN CLIENT/MACHINE INFO TABLE with vertical sidebar ====== */}
              <div className="flex border border-slate-900 mb-[6px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                {/* Vertical Sidebar */}
                <div className="w-[18px] bg-slate-50 border-r border-slate-900 flex items-center justify-center relative overflow-hidden shrink-0">
                  <p style={{ fontSize: '6px', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.1em', color: '#444', position: 'absolute', writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: 0 }}>Réservé à SOMACS SERVICE</p>
                </div>
                {/* Fields table */}
                <table className="flex-1 border-collapse">
                  <tbody>
                    <tr>
                      <td className="border-b border-r border-slate-900 bg-slate-50 p-1 w-[18%]">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Client</p>
                      </td>
                      <td className="border-b border-r border-slate-900 p-1 w-[42%]">
                        <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.clientName || ''}</span>
                      </td>
                      <td className="border-b border-r border-slate-900 bg-slate-50 p-1 w-[16%]">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Code client</p>
                      </td>
                      <td className="border-b border-slate-900 p-1 w-[24%]">
                        <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.clientCode || ''}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-slate-900 bg-slate-50 p-1">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Adresse</p>
                      </td>
                      <td className="border-b border-slate-900 p-1" colSpan="3">
                        <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.clientAddress || ''}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-slate-900 bg-slate-50 p-1">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Demandeur</p>
                      </td>
                      <td className="border-b border-r border-slate-900 p-1">
                        <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.requestorName || ''}</span>
                      </td>
                      <td className="border-b border-r border-slate-900 bg-slate-50 p-1">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Téléphone</p>
                      </td>
                      <td className="border-b border-slate-900 p-1">
                        <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.clientPhone || ''}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-slate-900 bg-slate-50 p-1">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>E-mail</p>
                      </td>
                      <td className="border-b border-slate-900 p-1" colSpan="3">
                        <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.clientEmail || ''}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-slate-900 bg-slate-50 p-1">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Equipement</p>
                      </td>
                      <td className="border-b border-slate-900 p-1" colSpan="3">
                        <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.machineType || ''}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-slate-900 bg-slate-50 p-1">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Marque</p>
                      </td>
                      <td className="border-b border-slate-900 p-1" colSpan="3">
                        <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.machineBrand || ''}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-slate-900 bg-slate-50 p-1">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Modèle</p>
                      </td>
                      <td className="border-b border-slate-900 p-1" colSpan="3">
                        <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.machineModel || ''}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-slate-900 bg-slate-50 p-1">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Numéro de série</p>
                      </td>
                      <td className="border-b border-slate-900 p-1" colSpan="3">
                        <span style={{ fontSize: '9px', fontWeight: '400', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{formData.serialNumber || ''}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-r border-slate-900 bg-slate-50 p-1">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Type de panne</p>
                      </td>
                      <td className="p-1" colSpan="3">
                        <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.problemDescription ? formData.problemDescription.substring(0, 80) : ''}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ====== DÉTAIL DE L'INTERVENTION ====== */}
              <div className="border border-slate-900 mb-[6px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <div className="bg-slate-50 border-b border-slate-900 p-1 text-center">
                  <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>Détail de l'intervention</p>
                </div>
                <div className="border-b border-slate-900 p-1 bg-white">
                  <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', textDecoration: 'underline', margin: 0 }}>Diagnostic téléphonique</p>
                </div>
                <div className="relative h-[110px]" style={{ background: 'repeating-linear-gradient(to bottom, white 0px, white 13px, #cbd5e1 13px, #cbd5e1 13.5px)' }}>
                  <div className="p-1.5">
                    <p style={{ fontSize: '8px', fontStyle: 'italic', color: '#1e40af', lineHeight: '13.5px', margin: 0 }}>
                      {formData.telephoneDiagnostic || ''}
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 flex">
                    <div className="flex border-t border-r border-slate-900">
                      <div className="bg-slate-50 border-r border-slate-900 px-1.5 py-0.5 flex items-center">
                        <p style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Nombre d'essai</p>
                      </div>
                      <div className="px-3 py-0.5 flex items-center justify-center min-w-[30px]">
                        <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.numEssai || ''}</span>
                      </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex border-t border-l border-slate-900">
                      <div className="bg-slate-50 border-r border-slate-900 px-1.5 py-0.5 flex items-center">
                        <p style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Essai concluant</p>
                      </div>
                      <div className="border-r border-slate-900 px-2 py-0.5 flex items-center justify-center">
                        <span style={{ fontSize: '8px', fontWeight: '700' }}>Oui</span>
                      </div>
                      <div className="px-2 py-0.5 flex items-center justify-center">
                        <span style={{ fontSize: '8px', fontWeight: '700' }}>Non</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ====== LES ARTICLES UTILISÉS TABLE ====== */}
              <div className="flex border border-slate-900 mb-[6px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <div className="w-[18px] bg-slate-50 border-r border-slate-900 flex items-center justify-center relative overflow-hidden shrink-0">
                  <p style={{ fontSize: '6px', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.1em', color: '#444', position: 'absolute', writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: 0 }}>Les articles utilisés</p>
                </div>
                <table className="flex-1 border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-r border-slate-900 bg-slate-50 p-1 text-center w-[30%]">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Référence</p>
                      </th>
                      <th className="border-b border-r border-slate-900 bg-slate-50 p-1 text-center">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Désignation</p>
                      </th>
                      <th className="border-b border-slate-900 bg-slate-50 p-1 text-center w-[18%]">
                        <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Quantité</p>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1,2,3,4,5,6].map((row) => (
                      <tr key={row}>
                        <td className={`${row < 6 ? 'border-b' : ''} border-r border-slate-900 p-1 h-[14px]`}></td>
                        <td className={`${row < 6 ? 'border-b' : ''} border-r border-slate-900 p-1 h-[14px]`}></td>
                        <td className={`${row < 6 ? 'border-b' : ''} border-slate-900 p-1 h-[14px]`}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ====== PRIX M.O (HT) ====== */}
              <div className="flex justify-center mb-[8px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <div className="border border-slate-900 flex">
                  <div className="bg-slate-50 px-4 py-1.5 border-r border-slate-900 flex items-center">
                    <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Prix M.O (HT) :</p>
                  </div>
                  <div className="px-8 py-1.5 flex items-center justify-center min-w-[80px]">
                    <span style={{ fontSize: '9px', fontWeight: '400' }}>{formData.laborPrice || ''}</span>
                  </div>
                </div>
              </div>

              {/* ====== SIGNATURES ====== */}
              <div className="flex gap-0 mb-[6px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <div className="flex-1 border border-slate-900">
                  <div className="bg-slate-50 border-b border-slate-900 p-1 text-center">
                    <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Signature du technicien</p>
                  </div>
                  <div className="h-[50px] flex items-center justify-center">
                    <p style={{ fontSize: '7px', color: '#e2e8f0', fontStyle: 'italic' }}>{formData.technicianName || ''}</p>
                  </div>
                </div>
                <div className="w-[30px]"></div>
                <div className="flex-1 border border-slate-900">
                  <div className="bg-slate-50 border-b border-slate-900 p-1 text-center">
                    <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Signature et cachet client</p>
                  </div>
                  <div className="h-[50px]"></div>
                </div>
              </div>

              {/* ====== FOOTER ====== */}
              <div className="absolute bottom-3 left-7 right-7 border-t border-slate-300 pt-1.5 flex justify-between items-center" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <p style={{ fontSize: '7px', fontWeight: '600', color: '#64748b', margin: 0 }}>Adresse : 2/2 Rue El Fouledh , Z.I  Mégrine Riadh | Tel : 71296493</p>
                <p style={{ fontSize: '7px', fontWeight: '700', color: '#64748b', margin: 0 }}>MF : 1420197A/A/M/000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
