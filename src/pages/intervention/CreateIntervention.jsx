import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
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
  UserCheck,
  Eye,
  Plus,
  Search,
  Users
} from 'lucide-react'
import logo from '../../assets/logo.jpg'
import FicheContent from '../../components/intervention/FicheContent'
import MobileFichePreviewModal from '../../components/intervention/MobileFichePreviewModal'
import ClientSelectionModal from '../../components/client/ClientSelectionModal'
import MachineSelectionModal from '../../components/machine/MachineSelectionModal'
import { getStepLabelColor } from '../../utils/stepStyles'

const steps = [
  { id: 1, title: 'Client', description: 'Identification', icon: User },
  { id: 2, title: 'Machine', description: 'Fiche Technique', icon: Settings },
  { id: 3, title: 'Diagnostic', description: 'Analyse initiale', icon: AlertCircle },
  { id: 4, title: 'Validation', description: 'Clôture dossier', icon: ClipboardCheck },
]

function generateFicheNumber() {
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const HH = String(d.getHours()).padStart(2, '0')
  const MM = String(d.getMinutes()).padStart(2, '0')
  const SS = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd} ${HH}${MM}${SS}`
}

// ── Shared fiche content (identical layout for both desktop preview and mobile modal) ──
export default function CreateIntervention() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [uiZoomPercent, setUiZoomPercent] = useState(100)
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false)
  const baseDprRef = useRef(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
  const [formData, setFormData] = useState(() => ({
    clientId: '',
    clientName: '',
    clientCode: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    siteName: '',
    requestorName: '',
    machineId: '',
    machineType: '',
    machineBrand: '',
    machineModel: '',
    serialNumber: '',
    problemDescription: '',
    telephoneDiagnostic: '',
    interventionDetail: '',
    interventionType: 'Réparation',
    interventionDate: new Date().toISOString().split('T')[0],
    totalTime: '',
    ficheNumber: generateFicheNumber(),
    technicianName: '',
    numEssai: '',
    essaiConcluant: null,
    laborPrice: ''
  }))
  const previewInterventionData = {
    ...formData,
    startTime: '',
    endTime: '',
  }
  const previewParts = []
  const previewLaborPrice = Number(formData.laborPrice) || ''

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const toPercent = (value) => {
      const n = Number(value)
      if (!Number.isFinite(n) || n <= 0) return null
      return Math.round(n * 100)
    }

    const computeZoomPercent = () => {
      const base = baseDprRef.current || 1
      const current = window.devicePixelRatio || 1
      const byDpr = Math.round((current / base) * 100)

      const byWindowRatio =
        window.innerWidth > 0 && window.outerWidth > 0
          ? Math.round((window.outerWidth / window.innerWidth) * 100)
          : null

      const viewportScale = window.visualViewport?.scale
      const byViewport = toPercent(viewportScale)

      // Prefer sources that actually change with browser zoom.
      let next = byWindowRatio
      if (!next || next === 100) next = byViewport
      if (!next || next === 100) next = byDpr
      if (!next || !Number.isFinite(next)) next = 100

      setUiZoomPercent(next)
    }

    computeZoomPercent()
    window.addEventListener('resize', computeZoomPercent)
    window.visualViewport?.addEventListener('resize', computeZoomPercent)

    return () => {
      window.removeEventListener('resize', computeZoomPercent)
      window.visualViewport?.removeEventListener('resize', computeZoomPercent)
    }
  }, [])

  const useHorizontalProgress = uiZoomPercent > 80

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleClientSelect = (client) => {
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientCode: client.code,
      clientPhone: client.phone,
      clientEmail: client.email,
      clientAddress: String(client.address || '').trim()
        ? String(client.address || '').trim()
        : `${client.city}${client.zone ? `, ${client.zone}` : ''}`
    }))
  }

  const handleMachineSelect = (machine) => {
    setFormData(prev => ({
      ...prev,
      machineId: machine.id,
      machineType: machine.designation,
      machineBrand: machine.brand,
      machineModel: String(machine.model || '').trim() ? machine.model : machine.year,
      serialNumber: machine.serialNumber,
      siteName: String(prev.siteName || '').trim() ? prev.siteName : (machine.site || '')
    }))
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const createIntervention = async () => {
    try {
      if (!formData.clientId || !formData.machineId) {
        alert('Veuillez sélectionner un client et une machine avant de créer le dossier.')
        return
      }
      const response = await apiFetch('/interventions', {
        method: 'POST',
        body: {
          status: 'PENDING',
          technicianName: formData.technicianName,
          interventionDate: formData.interventionDate,
          ficheNumber: formData.ficheNumber,
          totalTime: formData.totalTime,
          siteName: formData.siteName,
          requestorName: formData.requestorName,
          problemDescription: formData.problemDescription,
          telephoneDiagnostic: formData.telephoneDiagnostic,
          interventionType: formData.interventionType,
          interventionDetail: formData.interventionDetail,
          numEssai: formData.numEssai,
          essaiConcluant: formData.essaiConcluant,
          laborPrice: formData.laborPrice,
          clientId: formData.clientId || null,
          machineId: formData.machineId || null,
        },
      })
      if (!response.ok) {
        alert('Erreur lors de la création du dossier.')
        return
      }
      const created = await response.json().catch(() => null)
      const createdId = created?.id
      const highlight = createdId ? `?highlight=${encodeURIComponent(createdId)}&toast=created` : '?toast=created'
      navigate(`/interventions${highlight}`, { state: { createdInterventionId: createdId } })
    } catch {
      alert('Impossible de joindre le serveur.')
    }
  }

  const renderStep1 = () => (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-6 border-b-2 border-slate-100 flex flex-col items-start gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                  <Building2 className="text-[#0052CC]" size={28} />
                  Informations Client
                </h2>
                <p className="text-sm text-slate-500 font-medium">Renseignez les coordonnées complètes du client et le lieu d'intervention</p>
              </div>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-12 w-fit whitespace-nowrap bg-[#0052CC] hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider leading-none transition-colors shadow-xl shadow-blue-100 shrink-0"
              >
                <Users size={18} />
                Créer / Sélectionner Client
              </button>
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
                    readOnly
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
                    readOnly
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
                    readOnly
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
                    readOnly
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
                    readOnly
                    placeholder="Saisissez l'adresse physique complète : rue, ville, code postal..."
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal h-32 resize-none shadow-sm hover:border-slate-300 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
  )

  const renderStep2 = () => (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-6 border-b-2 border-slate-100 flex flex-col items-start gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                  <Settings className="text-orange-500" size={28} />
                  Fiche Technique Machine
                </h2>
                <p className="text-sm text-slate-500 font-medium">Identifiez précisément l'équipement concerné par l'intervention</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMachineModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-12 w-fit whitespace-nowrap bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider leading-none transition-colors shadow-xl shadow-orange-100 shrink-0"
              >
                <Cpu size={18} />
                Créer / Choisir Machine
              </button>
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
                    readOnly
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
                    readOnly
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
                    readOnly
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
                    readOnly
                    placeholder="SN-123456789"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-slate-800 font-bold font-mono placeholder:text-slate-400 placeholder:font-normal tracking-wider shadow-sm hover:border-slate-300"
                  />
                </div>
              </div>
            </div>

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

  const renderStep3 = () => (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
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
                    placeholder="Décrivez précisément le type de panne..."
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal h-32 resize-none leading-relaxed shadow-sm hover:border-slate-300"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
  )

  const renderStep4 = () => (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-6 border-b-2 border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <ClipboardCheck size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Validation</h2>
                  <p className="text-sm text-slate-500 font-medium">Vérifiez les informations saisies avant de créer le dossier</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="w-14 h-14 shrink-0">
                  <img src={logo} alt="Logo Left" className="w-full h-full object-contain grayscale opacity-80" />
                </div>
                <div className="text-center flex-1 px-2">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">Fiche d’intervention de S.A.V</p>
                  <p className="text-xs italic text-slate-500 mt-1">Nous vous garantissons la qualité</p>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700 mt-1">SOMACS SERVICE S.A.R.L</p>
                </div>
                <div className="w-14 h-14 shrink-0">
                  <img src={logo} alt="Logo Right" className="w-full h-full object-contain grayscale opacity-80" />
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client / Site</p>
                      <p className="text-sm font-black text-slate-900">Coordonnées</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Client</p>
                      <p className="text-sm font-black text-slate-900">{formData.clientName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Code client</p>
                      <p className="text-sm font-semibold text-slate-700">{formData.clientCode || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Téléphone</p>
                      <p className="text-sm font-semibold text-slate-700">{formData.clientPhone || '—'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Adresse</p>
                      <p className="text-sm font-semibold text-slate-700 break-words">{formData.clientAddress || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Site</p>
                      <p className="text-sm font-semibold text-slate-700">{formData.siteName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Demandeur</p>
                      <p className="text-sm font-semibold text-slate-700">{formData.requestorName || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Machine</p>
                      <p className="text-sm font-black text-slate-900">Fiche technique</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Type</p>
                      <p className="text-sm font-black text-slate-900">{formData.machineType || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Marque</p>
                      <p className="text-sm font-semibold text-slate-700">{formData.machineBrand || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Modèle</p>
                      <p className="text-sm font-semibold text-slate-700">{formData.machineModel || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">N° Série</p>
                      <p className="text-sm font-semibold text-slate-700 break-words">{formData.serialNumber || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Date</p>
                      <p className="text-sm font-semibold text-slate-700">{formData.interventionDate || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">N° Fiche</p>
                      <p className="text-sm font-semibold text-slate-700 break-words">{formData.ficheNumber || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Technicien</p>
                      <p className="text-sm font-semibold text-slate-700">{formData.technicianName || 'Non assigné'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Temps total</p>
                      <p className="text-sm font-semibold text-slate-700">{formData.totalTime || '—'}</p>
                    </div>
                  </div>
                </div>
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

  const renderStepContent = () => {
    const renderer = stepRenderers[currentStep]
    return renderer ? renderer() : null
  }


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-x-hidden">

      {/* ── Header ── */}
      <div className="bg-white border-b-2 border-slate-200 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <button
            onClick={() => navigate('/interventions')}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition-all active:scale-95 shadow-sm shrink-0"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">Nouvelle Intervention</h1>
              <span className="hidden sm:inline px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-lg shadow-blue-200 shrink-0">
                SAV Administration
              </span>
            </div>
            <p className="hidden sm:flex text-slate-500 text-sm font-semibold mt-1 items-center gap-2">
              <Calendar size={14} />
              Création et enregistrement d'un nouveau dossier d'intervention
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button className="hidden sm:flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md active:scale-95">
            <Printer size={18} /> Brouillon
          </button>
        </div>
      </div>

      {/* ── Mobile / Tablet horizontal stepper ── */}
      <div className={`${useHorizontalProgress ? 'bg-white border-b border-slate-100 px-4 py-3 shrink-0' : 'lg:hidden bg-white border-b border-slate-100 px-4 py-3 shrink-0'}`}>
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            const Icon = step.icon
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isActive ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-200 scale-110'
                    : isCompleted ? 'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wide ${getStepLabelColor(isActive, isCompleted)}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors duration-300 ${currentStep > step.id ? 'bg-green-400' : 'bg-slate-100'}`} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-w-0">

        {/* ── Desktop left stepper sidebar ── */}
        <div className={`${useHorizontalProgress ? 'hidden' : 'hidden lg:flex w-[320px] border-r border-slate-50 bg-slate-50/30 flex-col p-8 shrink-0 min-w-0'}`}>
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
        </div>

        {/* ── Form area ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white flex flex-col min-w-0">
          <div className="flex-1 px-4 sm:px-8 md:px-12 py-8 sm:py-12 md:py-16 max-w-4xl mx-auto w-full min-w-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
              }}
              className="h-full flex flex-col"
            >
              <div className="flex-1">
                {renderStepContent()}
              </div>

              {/* ── Navigation buttons ── */}
              <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t-2 border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between shrink-0 gap-4 sm:gap-3">
                {/* Right side buttons (Continuer/Valider) placed first on mobile via order */}
                <div className="order-1 sm:order-2">
                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="w-full sm:w-auto group flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-[#0052CC] hover:to-blue-700 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-slate-300 hover:shadow-blue-300 active:scale-95"
                    >
                      Continuer
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={createIntervention}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 sm:px-12 py-4 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-green-300 active:scale-95"
                    >
                      <Check size={18} strokeWidth={3} />
                      Valider
                    </button>
                  )}
                </div>

                {/* Left side buttons (Précédente/Aperçu) placed second on mobile via order */}
                <div className="flex items-center justify-between sm:justify-start gap-3 order-2 sm:order-1">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all ${
                      currentStep === 1
                        ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 shadow-sm hover:shadow-md border border-slate-200'
                    }`}
                  >
                    <ChevronLeft size={18} />
                    <span className="hidden sm:inline">Étape </span>Précédente
                  </button>

                  {/* Aperçu button — mobile/tablet only */}
                  <button
                    type="button"
                    onClick={() => setShowMobilePreview(true)}
                    className="xl:hidden flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 border border-indigo-200"
                  >
                    <Eye size={16} />
                    Aperçu
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ── Desktop fiche preview ── */}
        <div className="hidden xl:flex w-[620px] bg-slate-100 border-l border-slate-200 flex-col items-center justify-start overflow-y-auto no-scrollbar py-8 px-6 min-w-0">
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Aperçu de la fiche officielle</h4>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0052CC]"></div>
              </div>
            </div>

            <div className="w-full bg-white shadow-2xl rounded-none px-7 pt-5 pb-8 relative transition-all duration-700 overflow-hidden border border-slate-300 text-slate-900 leading-none" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <FicheContent interventionData={previewInterventionData} parts={previewParts} laborPrice={previewLaborPrice} logo={logo} />
            </div>
          </div>
        </div>

      </div>

      {/* ── Mobile preview modal ── */}
      {showMobilePreview && (
        <MobileFichePreviewModal
          onClose={() => setShowMobilePreview(false)}
          interventionData={previewInterventionData}
          parts={previewParts}
          laborPrice={previewLaborPrice}
          logo={logo}
        />
      )}

      {/* ── Client Selection Modal ── */}
      <ClientSelectionModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSelect={handleClientSelect}
      />

      {/* ── Machine Selection Modal ── */}
      <MachineSelectionModal 
        isOpen={isMachineModalOpen}
        onClose={() => setIsMachineModalOpen(false)}
        onSelect={handleMachineSelect}
      />
    </div>
  )
}
