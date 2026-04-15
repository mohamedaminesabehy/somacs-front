import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import { 
  ChevronLeft, 
  Clock, 
  User, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Save,
  PhoneCall,
  PenTool,
  Calendar,
  Building2,
  Hash,
  Phone,
  MapPin,
  Cpu,
  Zap,
  FileText,
  ShieldCheck,
  Package,
  Printer,
  ClipboardCheck,
  ChevronRight,
  Check,
  Wrench,
  Eye,
  XCircle
} from 'lucide-react'
import logo from '../../assets/logo.jpg'

// ── Per-intervention mock data (keyed by intervention ID) ──
// Each entry has: status, completedUpToSection (1-4), and the fields filled.
// Fields beyond completedUpToSection are intentionally empty strings.
const interventionsDB = {
  'INT-2026-001': {
    status: 'IN_PROGRESS',
    completedUpToSection: 2,  // sections 1+2 done, on section 3 (Articles)
    technicianName: 'Jean Dupont',
    interventionDate: '2026-03-01',
    ficheNumber: '2026/03/01 100201',
    startTime: '08:30',
    endTime: '11:45',
    totalTime: '3h15',
    siteName: 'Mégrine Riadh',
    clientName: 'Garage Central',
    clientCode: 'CLT-882',
    clientPhone: '99184688',
    clientEmail: 'contact@garagecentral.tn',
    clientAddress: '2/2 Rue El Fouledh, Z.I Mégrine Riadh',
    requestorName: 'Ahmed Ben Salah',
    machineType: 'Pont Élévateur 4T',
    machineBrand: 'Ravaglioli',
    machineModel: 'RAV-3000',
    serialNumber: 'SN-99184688',
    problemDescription: 'Fuite hydraulique vérin gauche - Intervention urgente demandée.',
    telephoneDiagnostic: 'Tentative de résolution à distance : vérification pression, test électrovanne. Problème persistant, intervention sur site requise.',
    interventionType: 'Réparation',
    interventionDetail: 'Remplacement joint hydraulique vérin gauche, purge circuit hydraulique, test pression 250 bars.',
    numEssai: '2',
    essaiConcluant: true,
    parts: [
      { id: 1, reference: 'PART-001', designation: 'Filtre à air haute performance', quantity: 2 },
      { id: 2, reference: 'PART-082', designation: 'Huile hydraulique 5L', quantity: 1 },
    ],
    laborPrice: 0,
  },
  'INT-2026-002': {
    status: 'PENDING',
    completedUpToSection: 1,  // only section 1 done (informations), on section 1
    technicianName: '',
    interventionDate: '2026-03-02',
    ficheNumber: '2026/03/02 100302',
    startTime: '',
    endTime: '',
    totalTime: '',
    siteName: '',
    clientName: 'Usine MetalPlus',
    clientCode: 'CLT-445',
    clientPhone: '71445001',
    clientEmail: 'info@metalplus.tn',
    clientAddress: 'Zone Industrielle Ben Arous',
    requestorName: 'Karim Mansouri',
    machineType: 'Compresseur Industriel',
    machineBrand: 'Atlas Copco',
    machineModel: 'GA-55',
    serialNumber: 'SN-44500232',
    problemDescription: 'Compresseur en surchauffe — arrêt automatique fréquent.',
    telephoneDiagnostic: '',
    interventionType: 'Réparation',
    interventionDetail: '',
    numEssai: '',
    essaiConcluant: null,
    parts: [],
    laborPrice: 0,
  },
  'INT-2026-003': {
    status: 'ASSIGNED',
    completedUpToSection: 1,  // section 1 done, on section 2 (Diagnostic)
    technicianName: 'Pierre Martin',
    interventionDate: '2026-03-02',
    ficheNumber: '2026/03/02 100303',
    startTime: '',
    endTime: '',
    totalTime: '',
    siteName: 'Radès',
    clientName: 'Logistique Express',
    clientCode: 'CLT-116',
    clientPhone: '70116200',
    clientEmail: 'contact@logexp.tn',
    clientAddress: 'Route de Radès, Km 4',
    requestorName: 'Sonia Trabelsi',
    machineType: 'Chariot Élévateur',
    machineBrand: 'Toyota',
    machineModel: 'TX3-20',
    serialNumber: 'SN-11600412',
    problemDescription: 'Chariot ne démarre plus après la nuit — batterie testée OK.',
    telephoneDiagnostic: '',
    interventionType: 'Réparation',
    interventionDetail: '',
    numEssai: '',
    essaiConcluant: null,
    parts: [],
    laborPrice: 0,
  },
  'INT-2026-004': {
    status: 'CLOSED',
    completedUpToSection: 4,  // everything done
    technicianName: 'Jean Dupont',
    interventionDate: '2026-02-28',
    ficheNumber: '2026/02/28 090401',
    startTime: '09:00',
    endTime: '12:30',
    totalTime: '3h30',
    siteName: 'Ariana',
    clientName: 'BTP Service',
    clientCode: 'CLT-290',
    clientPhone: '71290100',
    clientEmail: 'btp@service.tn',
    clientAddress: 'Cité El Intilaka, Ariana',
    requestorName: 'Hedi Boughzala',
    machineType: 'Générateur 50kVA',
    machineBrand: 'Caterpillar',
    machineModel: 'DE50E0',
    serialNumber: 'SN-29001140',
    problemDescription: 'Groupe électrogène ne démarre pas — panne démarreur.',
    telephoneDiagnostic: 'Diagnostic téléphonique : test batterie démarreur, contrôle relais. Démarreur HS confirmé.',
    interventionType: 'Réparation',
    interventionDetail: 'Remplacement démarreur 24V, test démarrage à froid x3, vérification alternateur.',
    numEssai: '3',
    essaiConcluant: true,
    parts: [
      { id: 1, reference: 'DEP-024V', designation: 'Démarreur 24V Caterpillar', quantity: 1 },
      { id: 2, reference: 'REL-001', designation: 'Relais de démarrage 24V', quantity: 2 },
    ],
    laborPrice: 320,
  },
  'INT-2026-005': {
    status: 'TESTING',
    completedUpToSection: 3,  // sections 1+2+3 done, on section 4 (Clôture)
    technicianName: 'Marie Curie',
    interventionDate: '2026-03-01',
    ficheNumber: '2026/03/01 110501',
    startTime: '11:00',
    endTime: '',
    totalTime: '',
    siteName: 'Sfax',
    clientName: 'AgriTech SA',
    clientCode: 'CLT-512',
    clientPhone: '74512080',
    clientEmail: 'contact@agritech.tn',
    clientAddress: 'Route de Gabès Km 8, Sfax',
    requestorName: 'Nabil Frikha',
    machineType: "Système d'Irrigation",
    machineBrand: 'Rain Bird',
    machineModel: 'ESP-RZX',
    serialNumber: 'SN-51200876',
    problemDescription: "Électrovanne principale bloquée en position fermée — pas d'arrosage depuis 48h.",
    telephoneDiagnostic: "Test téléphonique : vérification alimentation 24VAC OK, bobine testée = défectueuse.",
    interventionType: 'Réparation',
    interventionDetail: "Remplacement électrovanne 24VAC, recâblage zone A, test ouverture/fermeture x5.",
    numEssai: '5',
    essaiConcluant: true,
    parts: [
      { id: 1, reference: 'EV-24V-RB', designation: 'Électrovanne 24VAC Rain Bird', quantity: 1 },
      { id: 2, reference: 'CAB-2X1.5', designation: 'Câble 2x1.5mm² (10m)', quantity: 2 },
    ],
    laborPrice: 180,
  },
  'INT-2026-006': {
    status: 'PENDING',
    completedUpToSection: 1,
    technicianName: '',
    interventionDate: '2026-03-03',
    ficheNumber: '2026/03/03 140601',
    startTime: '',
    endTime: '',
    totalTime: '',
    siteName: 'La Marsa',
    clientName: 'Clinique Moderne',
    clientCode: 'CLT-780',
    clientPhone: '71780300',
    clientEmail: 'direction@cliniquemoderne.tn',
    clientAddress: 'Avenue de la Marsa, La Marsa',
    requestorName: 'Dr. Leila Zouari',
    machineType: 'Ascenseur Bloc B',
    machineBrand: 'Otis',
    machineModel: 'Gen2-MRL',
    serialNumber: 'SN-78000201',
    problemDescription: "Ascenseur bloqué entre 2ème et 3ème étage — alarme active.",
    telephoneDiagnostic: '',
    interventionType: 'Garantie',
    interventionDetail: '',
    numEssai: '',
    essaiConcluant: null,
    parts: [],
    laborPrice: 0,
  },
  'INT-2026-007': {
    status: 'ASSIGNED',
    completedUpToSection: 1,
    technicianName: 'Sarah Martin',
    interventionDate: '2026-03-03',
    ficheNumber: '2026/03/03 150701',
    startTime: '',
    endTime: '',
    totalTime: '',
    siteName: 'Tunis',
    clientName: 'MegaDistrib SA',
    clientCode: 'CLT-331',
    clientPhone: '71331900',
    clientEmail: 'logistique@megadistrib.tn',
    clientAddress: 'Zone Logistique Charguia II, Tunis',
    requestorName: 'Amine Chaouachi',
    machineType: 'Porte Automatique',
    machineBrand: 'CAME',
    machineModel: 'BXV-10',
    serialNumber: 'SN-33101551',
    problemDescription: "Motorisation de porte à ouverture incomplète — blocage à 70% de course.",
    telephoneDiagnostic: '',
    interventionType: 'Réparation',
    interventionDetail: '',
    numEssai: '',
    essaiConcluant: null,
    parts: [],
    laborPrice: 0,
  },
}

// Map workflow status → which section to open when entering the dossier
const statusToSection = {
  PENDING:     1,
  ASSIGNED:    2,
  IN_PROGRESS: 2,
  TESTING:     3,
  CLOSED:      4,
}

const statusConfig = {
  PENDING:     { label: 'En attente',     color: 'bg-amber-50 text-amber-700 border border-amber-200',    dot: 'bg-amber-500'   },
  ASSIGNED:    { label: 'Affectée',       color: 'bg-blue-50 text-blue-700 border border-blue-200',       dot: 'bg-blue-500'    },
  IN_PROGRESS: { label: 'En cours',       color: 'bg-orange-50 text-orange-700 border border-orange-200', dot: 'bg-orange-500'  },
  TESTING:     { label: 'En test',        color: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500'  },
  CLOSED:      { label: 'Clôturé',        color: 'bg-green-50 text-green-700 border border-green-200',    dot: 'bg-green-500'   },
}

function formatClientAddress(client) {
  if (!client) return ''
  if (client.address) return String(client.address)
  const city = client.city ? String(client.city).trim() : ''
  const zone = client.zone ? String(client.zone).trim() : ''
  if (!city && !zone) return ''
  return zone ? `${city}, ${zone}` : city
}

function buildAssignedEmployeesDisplay(missionLike, fallback = '') {
  const primary = String(missionLike?.employee || '').trim()
  const fromArray = Array.isArray(missionLike?.groupedEmployees)
    ? missionLike.groupedEmployees.map((name) => String(name || '').trim()).filter(Boolean)
    : []
  const fromDisplay = String(missionLike?.employeeDisplay || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
  const fallbackName = String(fallback || '').trim()
  const names = Array.from(new Set([primary, ...fromArray, ...fromDisplay, fallbackName].filter(Boolean)))
  return names.join(', ')
}

function mapEntryToInterventionData(entry, assignedTechnicianName) {
  const clientEntity = entry?.clientEntity || null
  const machineEntity = entry?.machineEntity || null

  return {
    clientId: entry?.clientId || clientEntity?.id || '',
    machineId: entry?.machineId || machineEntity?.id || '',
    interventionDate: entry?.interventionDate || entry?.date || '',
    ficheNumber: entry?.ficheNumber || '',
    startTime: entry?.startTime || '',
    endTime: entry?.endTime || '',
    totalTime: entry?.totalTime || '',
    siteName: entry?.siteName || machineEntity?.site || '',
    clientName: entry?.clientName || entry?.client || clientEntity?.name || '',
    clientCode: entry?.clientCode || clientEntity?.code || '',
    clientPhone: entry?.clientPhone || entry?.phone || clientEntity?.phone || '',
    clientEmail: entry?.clientEmail || clientEntity?.email || '',
    clientAddress: entry?.clientAddress || formatClientAddress(clientEntity) || '',
    requestorName: entry?.requestorName || '',
    machineType: entry?.machineType || entry?.machine || machineEntity?.designation || '',
    machineBrand: entry?.machineBrand || machineEntity?.brand || '',
    machineModel: entry?.machineModel || machineEntity?.year || '',
    serialNumber: entry?.serialNumber || machineEntity?.serialNumber || '',
    problemDescription: entry?.problemDescription || entry?.request || '',
    telephoneDiagnostic: entry?.telephoneDiagnostic || '',
    interventionType: entry?.interventionType || entry?.type || '',
    interventionDetail: entry?.interventionDetail || '',
    numEssai: entry?.numEssai || '',
    essaiConcluant: entry?.essaiConcluant ?? null,
    technicianName: assignedTechnicianName || entry?.technicianName || entry?.assignedTo || entry?.assignee || '',
  }
}

const sections = [
  { id: 1, title: 'Informations', description: 'Client & Équipement', icon: Building2 },
  { id: 2, title: 'Diagnostic', description: 'Analyse & Expertise', icon: AlertCircle },
  { id: 3, title: 'Articles', description: 'Pièces utilisées', icon: Package },
  { id: 4, title: 'Clôture', description: 'Signatures & Validation', icon: ClipboardCheck },
]

// ── Shared fiche content (identical layout for both desktop preview and mobile modal) ──
function FicheContent({ interventionData, parts, laborPrice, logo }) {
  return (
    <>
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

      <table className="w-full border-collapse border border-slate-900 mb-[6px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <tbody>
          <tr>
            <td className="border border-slate-900 bg-slate-50 p-1 w-[22%]">
              <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Date de l'intervention</p>
            </td>
            <td className="border border-slate-900 p-1 text-center w-[20%]">
              <span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.interventionDate ? interventionData.interventionDate.split('-').reverse().join('/') : '....../....../2026'}</span>
            </td>
            <td className="border border-slate-900 bg-slate-50 p-1 w-[15%]">
              <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Heure d'entrée</p>
            </td>
            <td className="border border-slate-900 p-1 text-center w-[13%]">
              <span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.startTime || '........h..........'}</span>
            </td>
            <td className="border border-slate-900 bg-slate-50 p-1 text-center" rowSpan="3" style={{ width: '18%', verticalAlign: 'top' }}>
              <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Prise en charge par</p>
              <p style={{ fontSize: '9px', fontWeight: '400', marginTop: '6px' }}>{interventionData.technicianName || ''}</p>
            </td>
          </tr>
          <tr>
            <td className="border border-slate-900 bg-slate-50 p-1">
              <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Numéro de la fiche</p>
            </td>
            <td className="border border-slate-900 p-1 text-center">
              <span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.ficheNumber}</span>
            </td>
            <td className="border border-slate-900 bg-slate-50 p-1">
              <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Heure de sortie</p>
            </td>
            <td className="border border-slate-900 p-1 text-center">
              <span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.endTime || '........h..........'}</span>
            </td>
          </tr>
          <tr>
            <td className="border border-slate-900 bg-slate-50 p-1">
              <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Site</p>
            </td>
            <td className="border border-slate-900 p-1 text-center">
              <span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.siteName || '..............................'}</span>
            </td>
            <td className="border border-slate-900 bg-slate-50 p-1">
              <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>TOTAL</p>
            </td>
            <td className="border border-slate-900 p-1 text-center">
              <span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.totalTime || '..............................'}</span>
            </td>
          </tr>
        </tbody>
      </table>

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
                <span style={{ fontSize: '11px', fontWeight: '700' }}>{interventionData.interventionType === type ? 'X' : ''}</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="flex border border-slate-900 mb-[6px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div className="w-[18px] bg-slate-50 border-r border-slate-900 flex items-center justify-center relative overflow-hidden shrink-0">
          <p style={{ fontSize: '6px', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.1em', color: '#444', position: 'absolute', writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: 0 }}>Réservé à SOMACS SERVICE</p>
        </div>
        <table className="flex-1 border-collapse">
          <tbody>
            <tr>
              <td className="border-b border-r border-slate-900 bg-slate-50 p-1 w-[18%]"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Client</p></td>
              <td className="border-b border-r border-slate-900 p-1 w-[42%]"><span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.clientName || ''}</span></td>
              <td className="border-b border-r border-slate-900 bg-slate-50 p-1 w-[16%]"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Code client</p></td>
              <td className="border-b border-slate-900 p-1 w-[24%]"><span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.clientCode || ''}</span></td>
            </tr>
            <tr>
              <td className="border-b border-r border-slate-900 bg-slate-50 p-1"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Adresse</p></td>
              <td className="border-b border-slate-900 p-1" colSpan="3"><span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.clientAddress || ''}</span></td>
            </tr>
            <tr>
              <td className="border-b border-r border-slate-900 bg-slate-50 p-1"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Demandeur</p></td>
              <td className="border-b border-r border-slate-900 p-1"><span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.requestorName || ''}</span></td>
              <td className="border-b border-r border-slate-900 bg-slate-50 p-1"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Téléphone</p></td>
              <td className="border-b border-slate-900 p-1"><span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.clientPhone || ''}</span></td>
            </tr>
            <tr>
              <td className="border-b border-r border-slate-900 bg-slate-50 p-1"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>E-mail</p></td>
              <td className="border-b border-slate-900 p-1" colSpan="3"><span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.clientEmail || ''}</span></td>
            </tr>
            <tr>
              <td className="border-b border-r border-slate-900 bg-slate-50 p-1"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Equipement</p></td>
              <td className="border-b border-slate-900 p-1" colSpan="3"><span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.machineType || ''}</span></td>
            </tr>
            <tr>
              <td className="border-b border-r border-slate-900 bg-slate-50 p-1"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Marque</p></td>
              <td className="border-b border-slate-900 p-1" colSpan="3"><span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.machineBrand || ''}</span></td>
            </tr>
            <tr>
              <td className="border-b border-r border-slate-900 bg-slate-50 p-1"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Modèle</p></td>
              <td className="border-b border-slate-900 p-1" colSpan="3"><span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.machineModel || ''}</span></td>
            </tr>
            <tr>
              <td className="border-b border-r border-slate-900 bg-slate-50 p-1"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Numéro de série</p></td>
              <td className="border-b border-slate-900 p-1" colSpan="3"><span style={{ fontSize: '9px', fontWeight: '400', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{interventionData.serialNumber || ''}</span></td>
            </tr>
            <tr>
              <td className="border-r border-slate-900 bg-slate-50 p-1"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Type de panne</p></td>
              <td className="p-1" colSpan="3"><span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.problemDescription ? interventionData.problemDescription.substring(0, 80) : ''}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border border-slate-900 mb-[6px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div className="bg-slate-50 border-b border-slate-900 p-1 text-center">
          <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>Détail de l'intervention</p>
        </div>
        <div className="border-b border-slate-900 p-1 bg-white">
          <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', textDecoration: 'underline', margin: 0 }}>
            Diagnostic téléphonique : <span style={{ fontWeight: '400', textTransform: 'none', textDecoration: 'none', marginLeft: '5px' }}>{interventionData.telephoneDiagnostic || ''}</span>
          </p>
        </div>
        <div className="relative h-[125px]" style={{ background: 'repeating-linear-gradient(to bottom, white 0px, white 13px, #cbd5e1 13px, #cbd5e1 13.5px)' }}>
          <div className="p-1.5">
            <p style={{ fontSize: '8px', fontStyle: 'italic', color: '#1e40af', lineHeight: '13.5px', margin: 0 }}>
              <span style={{ fontWeight: '700', textTransform: 'uppercase', textDecoration: 'underline', fontStyle: 'normal', color: '#000', marginRight: '5px' }}>Solution d'intervention :</span>
              {interventionData.interventionDetail || ''}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex">
            <div className="flex border-t border-r border-slate-900">
              <div className="bg-slate-50 border-r border-slate-900 px-1.5 py-0.5 flex items-center">
                <p style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Nombre d'essai</p>
              </div>
              <div className="px-3 py-0.5 flex items-center justify-center min-w-[30px]">
                <span style={{ fontSize: '9px', fontWeight: '400' }}>{interventionData.numEssai || ''}</span>
              </div>
            </div>
            <div className="flex-1"></div>
            <div className="flex border-t border-l border-slate-900">
              <div className="bg-slate-50 border-r border-slate-900 px-1.5 py-0.5 flex items-center">
                <p style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Essai concluant</p>
              </div>
              <div className={`border-r border-slate-900 px-2 py-0.5 flex items-center justify-center ${interventionData.essaiConcluant === true ? 'bg-green-100' : ''}`}>
                <span style={{ fontSize: '8px', fontWeight: '700' }}>Oui</span>
              </div>
              <div className={`px-2 py-0.5 flex items-center justify-center ${interventionData.essaiConcluant === false ? 'bg-red-100' : ''}`}>
                <span style={{ fontSize: '8px', fontWeight: '700' }}>Non</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border border-slate-900 mb-[6px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div className="w-[18px] bg-slate-50 border-r border-slate-900 flex items-center justify-center relative overflow-hidden shrink-0">
          <p style={{ fontSize: '6px', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.1em', color: '#444', position: 'absolute', writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: 0 }}>Les articles utilisés</p>
        </div>
        <table className="flex-1 border-collapse">
          <thead>
            <tr>
              <th className="border-b border-r border-slate-900 bg-slate-50 p-1 text-center w-[30%]"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Référence</p></th>
              <th className="border-b border-r border-slate-900 bg-slate-50 p-1 text-center"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Désignation</p></th>
              <th className="border-b border-slate-900 bg-slate-50 p-1 text-center w-[18%]"><p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Quantité</p></th>
            </tr>
          </thead>
          <tbody>
            {[0,1,2,3,4,5].map((row) => {
              const part = parts[row]
              return (
                <tr key={row}>
                  <td className={`${row < 5 ? 'border-b' : ''} border-r border-slate-900 p-1 h-[14px]`}>
                    {part && <span style={{ fontSize: '8px', fontWeight: '400' }}>{part.reference}</span>}
                  </td>
                  <td className={`${row < 5 ? 'border-b' : ''} border-r border-slate-900 p-1 h-[14px]`}>
                    {part && <span style={{ fontSize: '8px', fontWeight: '400' }}>{part.designation}</span>}
                  </td>
                  <td className={`${row < 5 ? 'border-b' : ''} border-slate-900 p-1 h-[14px] text-center`}>
                    {part && <span style={{ fontSize: '8px', fontWeight: '400' }}>{part.quantity}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mb-[8px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div className="border border-slate-900 flex">
          <div className="bg-slate-50 px-4 py-1.5 border-r border-slate-900 flex items-center">
            <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Prix M.O (HT) :</p>
          </div>
          <div className="px-8 py-1.5 flex items-center justify-center min-w-[80px]">
            <span style={{ fontSize: '9px', fontWeight: '400' }}>{laborPrice || ''}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-0 mb-[6px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div className="flex-1 border border-slate-900">
          <div className="bg-slate-50 border-b border-slate-900 p-1 text-center">
            <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Signature du technicien</p>
          </div>
          <div className="h-[50px] flex items-center justify-center">
            <p style={{ fontSize: '7px', color: '#e2e8f0', fontStyle: 'italic' }}>{interventionData.technicianName || ''}</p>
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

      <div className="absolute bottom-3 left-7 right-7 border-t border-slate-300 pt-1.5 flex justify-between items-center" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <p style={{ fontSize: '7px', fontWeight: '600', color: '#64748b', margin: 0 }}>Adresse : 2/2 Rue El Fouledh , Z.I  Mégrine Riadh | Tel : 71296493</p>
        <p style={{ fontSize: '7px', fontWeight: '700', color: '#64748b', margin: 0 }}>MF : 1420197A/A/M/000</p>
      </div>
    </>
  )
}

// ── Mobile preview modal: renders the exact same fiche, scaled to fit screen width ──
function MobilePreviewModal({ onClose, interventionData, parts, laborPrice, logo }) {
  const FICHE_WIDTH = 560 // intrinsic width of the fiche card (matches desktop px-7 padding)
  const wrapperRef = useRef(null)
  const [scale, setScale] = useState(1)

  const computeScale = useCallback(() => {
    if (wrapperRef.current) {
      const available = wrapperRef.current.clientWidth
      setScale(Math.min(1, available / FICHE_WIDTH))
    }
  }, [])

  useEffect(() => {
    computeScale()
    window.addEventListener('resize', computeScale)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', computeScale)
    }
    return () => {
      window.removeEventListener('resize', computeScale)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', computeScale)
      }
    }
  }, [computeScale])

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 xl:hidden animate-in fade-in duration-300">
      <div className="bg-white w-[min(100%,42rem)] h-[92dvh] max-h-[92dvh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <Eye size={18} />
            </div>
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs sm:text-sm">Aperçu de la fiche officielle</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
          >
            <Plus size={20} className="rotate-45" />
          </button>
        </div>

        {/* Scrollable fiche area */}
        <div ref={wrapperRef} className="flex-1 overflow-y-auto bg-slate-100 no-scrollbar p-3">
          {/* Outer container sized to scaled height so scrolling works correctly */}
          <div style={{ width: `${FICHE_WIDTH * scale}px`, height: `${Math.round(FICHE_WIDTH * scale * 1.414)}px`, margin: '0 auto' }}>
            {/* The fiche itself rendered at intrinsic width, then scaled down */}
            <div
              style={{
                width: `${FICHE_WIDTH}px`,
                transformOrigin: 'top left',
                transform: `scale(${scale})`,
              }}
            >
              <div className="bg-white shadow-2xl px-7 pt-5 pb-8 relative overflow-hidden border border-slate-300 text-slate-900 leading-none" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <FicheContent
                  interventionData={interventionData}
                  parts={parts}
                  laborPrice={laborPrice}
                  logo={logo}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
          >
            Fermer l'aperçu
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InterventionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const assignedTechnicianName = location.state?.assignedTechnicianName?.trim?.() || ''
  const missionId = location.state?.missionId
  const returnTo = location.state?.returnTo
  const isEmployeeHistoryEditFlow = Boolean(returnTo)
  const isReadOnlyView = Boolean(location.state?.readOnly)
  const [clients, setClients] = useState([])
  const [machines, setMachines] = useState([])
  const [dbEntry, setDbEntry] = useState(() => interventionsDB[id] || interventionsDB['INT-2026-001'])
  const [completedUpTo, setCompletedUpTo] = useState(() => (dbEntry?.completedUpToSection || 1))

  const [activeSection, setActiveSection] = useState(() => statusToSection[dbEntry?.status] || 1)
  const [uiZoomPercent, setUiZoomPercent] = useState(100)
  const [status, setStatus] = useState(dbEntry?.status || 'PENDING')
  const [isEditing, setIsEditing] = useState(() => (isReadOnlyView ? false : (isEmployeeHistoryEditFlow ? true : (dbEntry?.status || 'PENDING') !== 'CLOSED')))
  const [laborPrice, setLaborPrice] = useState(dbEntry?.laborPrice || 0)
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [assignedMissionEmployees, setAssignedMissionEmployees] = useState(() => assignedTechnicianName)
  const [interventionData, setInterventionData] = useState(() => mapEntryToInterventionData(dbEntry, assignedMissionEmployees || assignedTechnicianName))
  const baseDprRef = useRef(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)

  const selectedClient = useMemo(
    () => clients.find((c) => String(c.id) === String(interventionData.clientId)),
    [clients, interventionData.clientId],
  )
  const selectedMachine = useMemo(
    () => machines.find((m) => String(m.id) === String(interventionData.machineId)),
    [machines, interventionData.machineId],
  )

  const computeTotalTime = useCallback((start, end) => {
    if (!start || !end) return ''
    const [sh, sm] = String(start).split(':').map((v) => Number(v))
    const [eh, em] = String(end).split(':').map((v) => Number(v))
    if (![sh, sm, eh, em].every((n) => Number.isFinite(n))) return ''
    const startMinutes = sh * 60 + sm
    const endMinutes = eh * 60 + em
    let diff = endMinutes - startMinutes
    if (diff < 0) diff += 24 * 60
    const hours = Math.floor(diff / 60)
    const minutes = diff % 60
    return `${hours}h${String(minutes).padStart(2, '0')}m`
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setInterventionData(prev => ({ ...prev, [name]: value }))
  }

  const [parts, setParts] = useState(dbEntry?.parts || [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await apiFetch(`/interventions/${id}`)
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled && data) {
          setDbEntry(data)
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [clientsRes, machinesRes] = await Promise.all([
          apiFetch('/clients'),
          apiFetch('/machines'),
        ])
        const clientsJson = clientsRes.ok ? await clientsRes.json() : []
        const machinesJson = machinesRes.ok ? await machinesRes.json() : []
        if (!cancelled) {
          setClients(Array.isArray(clientsJson) ? clientsJson : [])
          setMachines(Array.isArray(machinesJson) ? machinesJson : [])
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        if (missionId) {
          const response = await apiFetch(`/missions/${missionId}`, { cache: 'no-store' })
          if (!response.ok) {
            if (!cancelled) setAssignedMissionEmployees(assignedTechnicianName)
            return
          }
          const missionData = await response.json()
          if (!cancelled) {
            setAssignedMissionEmployees(buildAssignedEmployeesDisplay(missionData, assignedTechnicianName))
          }
          return
        }

        const listResponse = await apiFetch('/missions', { cache: 'no-store' })
        if (!listResponse.ok) {
          if (!cancelled) setAssignedMissionEmployees(assignedTechnicianName)
          return
        }
        const missions = await listResponse.json().catch(() => [])
        const rows = Array.isArray(missions) ? missions : []
        const linkedRows = rows.filter((m) => String(m?.interventionId || '') === String(id))
        if (linkedRows.length === 0) {
          if (!cancelled) setAssignedMissionEmployees(assignedTechnicianName)
          return
        }

        const names = new Set()
        for (const row of linkedRows) {
          const display = buildAssignedEmployeesDisplay(row, assignedTechnicianName)
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean)
          display.forEach((name) => names.add(name))
        }
        if (!cancelled) {
          setAssignedMissionEmployees(names.size > 0 ? Array.from(names).join(', ') : assignedTechnicianName)
        }
      } catch {
        if (!cancelled) setAssignedMissionEmployees(assignedTechnicianName)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [missionId, assignedTechnicianName, id])

  useEffect(() => {
    setCompletedUpTo(dbEntry?.completedUpToSection || 1)
    setActiveSection(statusToSection[dbEntry?.status] || 1)
    setStatus(dbEntry?.status || 'PENDING')
    setLaborPrice(dbEntry?.laborPrice || 0)
    setParts(Array.isArray(dbEntry?.parts) ? dbEntry.parts : [])
    setInterventionData(mapEntryToInterventionData(dbEntry, assignedMissionEmployees || assignedTechnicianName))
  }, [dbEntry, assignedMissionEmployees, assignedTechnicianName])

  useEffect(() => {
    if (!selectedClient) return
    setInterventionData((prev) => ({
      ...prev,
      clientName: selectedClient.name || prev.clientName,
      clientCode: selectedClient.code || prev.clientCode,
      clientPhone: selectedClient.phone || prev.clientPhone,
      clientEmail: selectedClient.email || prev.clientEmail,
      clientAddress: formatClientAddress(selectedClient) || prev.clientAddress,
    }))
  }, [selectedClient])

  useEffect(() => {
    if (!selectedMachine) return
    setInterventionData((prev) => ({
      ...prev,
      machineType: selectedMachine.designation || prev.machineType,
      machineBrand: selectedMachine.brand || prev.machineBrand,
      machineModel:
        (String(selectedMachine.model || '').trim()
          ? selectedMachine.model
          : selectedMachine.year) || prev.machineModel,
      serialNumber: selectedMachine.serialNumber || prev.serialNumber,
      siteName: prev.siteName || selectedMachine.site,
    }))
  }, [selectedMachine])

  useEffect(() => {
    const computed = computeTotalTime(interventionData.startTime, interventionData.endTime)
    if (computed !== interventionData.totalTime) {
      setInterventionData((prev) => ({ ...prev, totalTime: computed }))
    }
  }, [computeTotalTime, interventionData.startTime, interventionData.endTime, interventionData.totalTime])

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

  const addPart = () => {
    setParts([...parts, { id: Date.now(), reference: '', designation: '', quantity: 1 }])
  }

  const removePart = (partId) => {
    setParts(parts.filter(p => p.id !== partId))
  }

  const updatePart = (partId, field, value) => {
    setParts(parts.map(p => p.id === partId ? { ...p, [field]: value } : p))
  }

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const buildFichePrintHtml_UNUSED = () => {
    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>Fiche d'intervention de S.A.V</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 12mm 14mm 12mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; font-size: 9px; }
    .sheet { width: 100%; position: relative; }

    /* ── Header ── */
    .header { display: flex; align-items: center; border-bottom: 1.5px solid #000; padding-bottom: 6px; margin-bottom: 5px; }
    .header-logo { width: 52px; height: 52px; object-fit: contain; }
    .header-center { flex: 1; text-align: center; padding: 0 8px; }
    .header-center h1 { font-size: 15px; font-weight: 900; text-transform: uppercase; margin: 0 0 2px 0; letter-spacing: 0.03em; }
    .header-center .tagline { font-size: 9px; font-style: italic; color: #444; margin: 0 0 2px 0; }
    .header-center .company { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0; }

    /* ── Tables ── */
    table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
    td, th { border: 1px solid #000; padding: 3px 4px; font-size: 9px; vertical-align: middle; }
    .lbl { font-weight: 700; text-transform: uppercase; background: #f0f0f0; white-space: nowrap; }
    .center { text-align: center; }
    .val { font-weight: 400; }

    /* ── Info header table ── */
    .tbl-info td { height: 18px; }
    .col-lbl { width: 22%; }
    .col-val { width: 18%; }
    .col-lbl2 { width: 14%; }
    .col-val2 { width: 12%; }
    .col-pec { width: 20%; vertical-align: top; }

    /* ── Type d'intervention ── */
    .tbl-type th { background: #f0f0f0; font-weight: 700; text-transform: uppercase; text-align: center; font-size: 9px; }
    .type-cell { height: 18px; font-size: 11px; font-weight: 700; }

    /* ── Réservé SOMACS ── */
    .reserved-wrap { display: flex; border: 1px solid #000; margin-bottom: 5px; }
    .reserved-label { width: 16px; background: #f0f0f0; border-right: 1px solid #000; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .reserved-label span { font-size: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; white-space: nowrap; writing-mode: vertical-rl; transform: rotate(180deg); color: #333; }
    .reserved-table { flex: 1; border-collapse: collapse; }
    .reserved-table td { border: 1px solid #000; border-left: none; border-right: none; padding: 3px 4px; font-size: 9px; vertical-align: middle; height: 17px; }
    .reserved-table td:first-child { border-left: none; }
    .reserved-table tr:last-child td { border-bottom: none; }
    .reserved-table .lbl { width: 20%; }
    .reserved-table .val-wide { width: 42%; }
    .reserved-table .lbl2 { width: 16%; }
    .reserved-table .val2 { width: 22%; }

    /* ── Détail intervention ── */
    .detail-wrap { border: 1px solid #000; margin-bottom: 5px; }
    .detail-title { background: #f0f0f0; border-bottom: 1px solid #000; padding: 3px 4px; text-align: center; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.05em; }
    .diag-row { border-bottom: 1px solid #000; padding: 3px 4px; font-size: 9px; }
    .diag-row b { text-transform: uppercase; text-decoration: underline; }
    .detail-lines { padding: 4px; min-height: 90px; font-size: 9px; background: repeating-linear-gradient(to bottom, #fff 0px, #fff 14px, #ccc 14px, #ccc 14.5px); }
    .detail-lines b { text-transform: uppercase; text-decoration: underline; }
    .essai-row { display: flex; border-top: 1px solid #000; }
    .essai-left { display: flex; border-right: 1px solid #000; }
    .essai-lbl { background: #f0f0f0; border-right: 1px solid #000; padding: 3px 6px; font-weight: 700; text-transform: uppercase; font-size: 8px; display: flex; align-items: center; }
    .essai-val { padding: 3px 10px; font-size: 9px; display: flex; align-items: center; min-width: 30px; }
    .essai-spacer { flex: 1; }
    .essai-right { display: flex; border-left: 1px solid #000; }
    .essai-oui { border-right: 1px solid #000; padding: 3px 8px; font-size: 8px; font-weight: 700; display: flex; align-items: center; }
    .essai-non { padding: 3px 8px; font-size: 8px; font-weight: 700; display: flex; align-items: center; }
    .checked-bg { background: #d1fae5; }
    .checked-no-bg { background: #fee2e2; }

    /* ── Articles ── */
    .articles-wrap { display: flex; border: 1px solid #000; margin-bottom: 5px; }
    .articles-label { width: 16px; background: #f0f0f0; border-right: 1px solid #000; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .articles-label span { font-size: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; white-space: nowrap; writing-mode: vertical-rl; transform: rotate(180deg); color: #333; }
    .articles-table { flex: 1; border-collapse: collapse; }
    .articles-table th { border: 1px solid #000; border-left: none; padding: 3px 4px; background: #f0f0f0; font-weight: 700; text-transform: uppercase; text-align: center; font-size: 9px; }
    .articles-table td { border: 1px solid #000; border-left: none; padding: 3px 4px; font-size: 8px; height: 16px; }
    .articles-table tr:last-child td { border-bottom: none; }
    .part-ref { width: 28%; }
    .part-des { }
    .part-qty { width: 16%; text-align: center; }

    /* ── Prix MO ── */
    .prix-wrap { display: flex; justify-content: center; margin-bottom: 7px; }
    .prix-box { display: flex; border: 1px solid #000; }
    .prix-lbl { background: #f0f0f0; border-right: 1px solid #000; padding: 4px 10px; font-weight: 700; text-transform: uppercase; font-size: 9px; display: flex; align-items: center; }
    .prix-val { padding: 4px 20px; font-size: 9px; min-width: 80px; display: flex; align-items: center; justify-content: center; }

    /* ── Signatures ── */
    .sig-wrap { display: flex; gap: 20px; margin-bottom: 6px; }
    .sig-box { flex: 1; border: 1px solid #000; }
    .sig-title { background: #f0f0f0; border-bottom: 1px solid #000; padding: 3px 4px; text-align: center; font-weight: 700; text-transform: uppercase; font-size: 9px; }
    .sig-area { height: 50px; }

    /* ── Footer ── */
    .footer { border-top: 1px solid #aaa; padding-top: 4px; display: flex; justify-content: space-between; font-size: 7.5px; color: #555; margin-top: 6px; }
    .footer b { font-weight: 700; }
  </style>
</head>
<body>
<div class="sheet">

  <!-- HEADER -->
  <div class="header">
    <img class="header-logo" src="${logoSrc}" alt="Logo" />
    <div class="header-center">
      <h1>Fiche d'intervention de S.A.V</h1>
      <p class="tagline">Nous vous garantissons la qualité</p>
      <p class="company">SOMACS SERVICE S.A.R.L</p>
    </div>
    <img class="header-logo" src="${logoSrc}" alt="Logo" />
  </div>

  <!-- DATE / FICHE / SITE -->
  <table class="tbl-info">
    <tr>
      <td class="lbl col-lbl">Date de l'intervention</td>
      <td class="val center col-val">${escapeHtml(dateDisplay)}</td>
      <td class="lbl col-lbl2">Heure d'entrée</td>
      <td class="val center col-val2">${escapeHtml(interventionData.startTime || '........h..........')}</td>
      <td class="lbl center col-pec" rowspan="3" style="vertical-align:top;padding-top:4px;">
        <div style="font-weight:700;text-transform:uppercase;font-size:9px;">Prise en charge par</div>
        <div style="font-weight:400;margin-top:6px;font-size:9px;">${escapeHtml(interventionData.technicianName || '')}</div>
      </td>
    </tr>
    <tr>
      <td class="lbl col-lbl">Numéro de la fiche</td>
      <td class="val center col-val">${escapeHtml(interventionData.ficheNumber || '')}</td>
      <td class="lbl col-lbl2">Heure de sortie</td>
      <td class="val center col-val2">${escapeHtml(interventionData.endTime || '........h..........')}</td>
    </tr>
    <tr>
      <td class="lbl col-lbl">Site</td>
      <td class="val center col-val">${escapeHtml(interventionData.siteName || '')}</td>
      <td class="lbl col-lbl2">TOTAL</td>
      <td class="val center col-val2">${escapeHtml(interventionData.totalTime || '')}</td>
    </tr>
  </table>

  <!-- TYPE D'INTERVENTION -->
  <table class="tbl-type">
    <thead>
      <tr>
        <th style="width:22%;">Type<br/>d'intervention</th>
        <th>Devis</th><th>Livraison</th><th>Formation</th><th>Installation</th><th>Réparation</th><th>Garantie</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="lbl" style="background:#f0f0f0;"></td>
        ${typeCheckboxes}
      </tr>
    </tbody>
  </table>

  <!-- RÉSERVÉ À SOMACS SERVICE -->
  <div class="reserved-wrap">
    <div class="reserved-label"><span>Réservé à SOMACS SERVICE</span></div>
    <table class="reserved-table">
      <tr>
        <td class="lbl">Client</td>
        <td class="val val-wide">${escapeHtml(interventionData.clientName || '')}</td>
        <td class="lbl lbl2">Code client</td>
        <td class="val val2">${escapeHtml(interventionData.clientCode || '')}</td>
      </tr>
      <tr>
        <td class="lbl">Adresse</td>
        <td class="val" colspan="3">${escapeHtml(interventionData.clientAddress || '')}</td>
      </tr>
      <tr>
        <td class="lbl">Demandeur</td>
        <td class="val">${escapeHtml(interventionData.requestorName || '')}</td>
        <td class="lbl">Téléphone</td>
        <td class="val">${escapeHtml(interventionData.clientPhone || '')}</td>
      </tr>
      <tr>
        <td class="lbl">E-mail</td>
        <td class="val" colspan="3">${escapeHtml(interventionData.clientEmail || '')}</td>
      </tr>
      <tr>
        <td class="lbl">Equipement</td>
        <td class="val" colspan="3">${escapeHtml(interventionData.machineType || '')}</td>
      </tr>
      <tr>
        <td class="lbl">Marque</td>
        <td class="val" colspan="3">${escapeHtml(interventionData.machineBrand || '')}</td>
      </tr>
      <tr>
        <td class="lbl">Modèle</td>
        <td class="val" colspan="3">${escapeHtml(interventionData.machineModel || '')}</td>
      </tr>
      <tr>
        <td class="lbl">Numéro de série</td>
        <td class="val" colspan="3">${escapeHtml(interventionData.serialNumber || '')}</td>
      </tr>
      <tr>
        <td class="lbl">Type de panne</td>
        <td class="val" colspan="3">${escapeHtml(interventionData.problemDescription || '')}</td>
      </tr>
    </table>
  </div>

  <!-- DÉTAIL DE L'INTERVENTION -->
  <div class="detail-wrap">
    <div class="detail-title">Détail de l'intervention</div>
    <div class="diag-row"><b>Diagnostic téléphonique :</b>&nbsp;${escapeHtml(interventionData.telephoneDiagnostic || '')}</div>
    <div class="detail-lines"><b>Solution d'intervention :</b>&nbsp;${escapeHtml(interventionData.interventionDetail || '')}</div>
    <div class="essai-row">
      <div class="essai-left">
        <div class="essai-lbl">Nombre d'essai</div>
        <div class="essai-val">${escapeHtml(String(interventionData.numEssai || ''))}</div>
      </div>
      <div class="essai-spacer"></div>
      <div class="essai-right">
        <div class="essai-lbl">Essai concluant</div>
        <div class="essai-oui${yes ? ' checked-bg' : ''}">Oui</div>
        <div class="essai-non${no ? ' checked-no-bg' : ''}">Non</div>
      </div>
    </div>
  </div>

  <!-- LES ARTICLES UTILISÉS -->
  <div class="articles-wrap">
    <div class="articles-label"><span>Les articles utilisés</span></div>
    <table class="articles-table">
      <thead>
        <tr>
          <th class="part-ref">Référence</th>
          <th>Désignation</th>
          <th class="part-qty">Quantité</th>
        </tr>
      </thead>
      <tbody>
        ${partRows}
      </tbody>
    </table>
  </div>

  <!-- PRIX M.O -->
  <div class="prix-wrap">
    <div class="prix-box">
      <div class="prix-lbl">Prix M.O (HT) :</div>
      <div class="prix-val">${escapeHtml(String(laborPrice || ''))}</div>
    </div>
  </div>

  <!-- SIGNATURES -->
  <div class="sig-wrap">
    <div class="sig-box">
      <div class="sig-title">Signature du technicien</div>
      <div class="sig-area"></div>
    </div>
    <div class="sig-box">
      <div class="sig-title">Signature et cachet client</div>
      <div class="sig-area"></div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <span>Adresse : 2/2 Rue El Fouledh , Z.I &nbsp; Mégrine Riadh 2014 Ben Arous &nbsp;&nbsp; GSM : 98326746 &nbsp;&nbsp; Tel : 71296493</span>
    <span><b>MF : 1420197A/A/M/000</b></span>
  </div>

</div>
</body>
</html>`
  }

  const buildFichePrintHtml = () => {
    const TYPES = ['Devis', 'Livraison', 'Formation', 'Installation', 'Réparation', 'Garantie']
    const currentType = interventionData.interventionType || ''
    const essaiOui = interventionData.essaiConcluant === true
    const essaiNon = interventionData.essaiConcluant === false
    const partRows6 = [0,1,2,3,4,5].map(i => parts[i] || null)
    const dateDisplay = interventionData.interventionDate
      ? interventionData.interventionDate.split('-').reverse().join('/')
      : '.…/.…./2026'

    return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Fiche d'intervention de S.A.V</title>
<style>
  @page { size: A4 portrait; margin: 10mm 10mm 12mm 10mm; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; color: #000; background: #fff; }

  /* ── HEADER ── */
  .hdr { display: flex; align-items: center; padding-bottom: 5pt; margin-bottom: 4pt; border-bottom: 1.5pt solid #000; }
  .hdr-logo { width: 48pt; height: 48pt; object-fit: contain; flex-shrink: 0; }
  .hdr-mid { flex: 1; text-align: center; padding: 0 6pt; }
  .hdr-mid .title { font-size: 14pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.1; }
  .hdr-mid .sub   { font-size: 8pt; font-style: italic; color: #555; margin-top: 2pt; }
  .hdr-mid .brand { font-size: 9.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2pt; }

  /* ── TABLES ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 3pt; }
  td, th { border: 0.75pt solid #000; padding: 2pt 3pt; vertical-align: middle; font-size: 8pt; }
  .bg { background: #efefef; }
  .bold { font-weight: 700; }
  .upper { text-transform: uppercase; }
  .center { text-align: center; }
  .small { font-size: 7pt; }

  /* ── TABLE 1 : date/heure ── */
  .t1 td { height: 16pt; }
  .t1 .c-lbl  { width: 21%; }
  .t1 .c-val  { width: 17%; }
  .t1 .c-lbl2 { width: 13%; }
  .t1 .c-val2 { width: 11%; }
  .t1 .c-pec  { width: 19%; vertical-align: top; padding-top: 3pt; }

  /* ── TABLE 2 : type d'intervention ── */
  .t2 th, .t2 td { height: 15pt; text-align: center; }
  .t2 .t2-lbl { width: 21%; text-align: center; }
  .t2 .chk { font-size: 11pt; font-weight: 900; }

  /* ── BLOC RÉSERVÉ ── */
  .bloc-res { display: flex; border: 0.75pt solid #000; margin-bottom: 3pt; }
  .res-bar  { width: 14pt; background: #efefef; border-right: 0.75pt solid #000; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
  .res-bar span { font-size: 5.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; writing-mode: vertical-rl; transform: rotate(180deg); color: #222; }
  .res-tbl { flex: 1; border-collapse: collapse; }
  .res-tbl td { border: 0.75pt solid #000; border-left: none; padding: 2pt 3pt; font-size: 8pt; height: 15pt; vertical-align: middle; }
  .res-tbl tr:last-child td { border-bottom: none; }
  .res-tbl .rl  { width: 19%; }
  .res-tbl .rv  { width: 40%; }
  .res-tbl .rl2 { width: 15%; }
  .res-tbl .rv2 { }

  /* ── DÉTAIL ── */
  .bloc-det { border: 0.75pt solid #000; margin-bottom: 3pt; }
  .det-title { background: #efefef; border-bottom: 0.75pt solid #000; padding: 2pt 4pt; text-align: center; font-weight: 700; text-transform: uppercase; font-size: 8pt; letter-spacing: 0.04em; }
  .det-diag  { border-bottom: 0.75pt solid #000; padding: 2.5pt 4pt; font-size: 8pt; min-height: 28pt; }
  .det-body  { padding: 3pt 4pt; min-height: 88pt; font-size: 8pt;
               background: repeating-linear-gradient(to bottom, #fff 0pt, #fff 13pt, #bbb 13pt, #bbb 13.5pt); }
  .det-essai { display: flex; border-top: 0.75pt solid #000; }
  .de-lbl    { background: #efefef; border-right: 0.75pt solid #000; padding: 2pt 5pt; font-weight: 700; text-transform: uppercase; font-size: 7.5pt; display: flex; align-items: center; white-space: nowrap; }
  .de-val    { padding: 2pt 8pt; font-size: 8pt; display: flex; align-items: center; min-width: 28pt; }
  .de-space  { flex: 1; }
  .de-conc   { display: flex; border-left: 0.75pt solid #000; }
  .de-oui    { border-right: 0.75pt solid #000; padding: 2pt 7pt; font-size: 7.5pt; font-weight: 700; display: flex; align-items: center; }
  .de-non    { padding: 2pt 7pt; font-size: 7.5pt; font-weight: 700; display: flex; align-items: center; }

  /* ── ARTICLES ── */
  .bloc-art { display: flex; border: 0.75pt solid #000; margin-bottom: 3pt; }
  .art-bar  { width: 14pt; background: #efefef; border-right: 0.75pt solid #000; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
  .art-bar span { font-size: 5.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; writing-mode: vertical-rl; transform: rotate(180deg); color: #222; }
  .art-tbl { flex: 1; border-collapse: collapse; }
  .art-tbl th { border: 0.75pt solid #000; border-left: none; padding: 2pt 3pt; background: #efefef; font-weight: 700; text-transform: uppercase; text-align: center; font-size: 8pt; }
  .art-tbl td { border: 0.75pt solid #000; border-left: none; padding: 2pt 3pt; font-size: 7.5pt; height: 14pt; }
  .art-tbl tr:last-child td { border-bottom: none; }
  .art-ref { width: 27%; }
  .art-des { }
  .art-qty { width: 14%; text-align: center; }

  /* ── PRIX ── */
  .prix-row { display: flex; justify-content: flex-end; margin-bottom: 4pt; padding-right: 0; }
  .prix-box { display: inline-flex; border: 0.75pt solid #000; }
  .prix-lbl { background: #efefef; border-right: 0.75pt solid #000; padding: 3pt 8pt; font-weight: 700; text-transform: uppercase; font-size: 8pt; display: flex; align-items: center; white-space: nowrap; }
  .prix-val { padding: 3pt 16pt; font-size: 8pt; min-width: 70pt; display: flex; align-items: center; }

  /* ── SIGNATURES ── */
  .sig-row { display: flex; gap: 16pt; margin-bottom: 5pt; }
  .sig-box { flex: 1; border: 0.75pt solid #000; }
  .sig-ttl { background: #efefef; border-bottom: 0.75pt solid #000; padding: 2pt 4pt; text-align: center; font-weight: 700; text-transform: uppercase; font-size: 8pt; }
  .sig-area { height: 44pt; }

  /* ── FOOTER ── */
  .ftr { border-top: 0.75pt solid #999; padding-top: 3pt; margin-top: 4pt; display: flex; justify-content: space-between; align-items: center; font-size: 7pt; color: #444; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="hdr">
  <img class="hdr-logo" src="${logo}" alt="Logo SOMACS"/>
  <div class="hdr-mid">
    <div class="title">Fiche d'intervention de S.A.V</div>
    <div class="sub">Nous vous garantissons la qualité</div>
    <div class="brand">SOMACS SERVICE S.A.R.L</div>
  </div>
  <img class="hdr-logo" src="${logo}" alt="Logo SOMACS"/>
</div>

<!-- TABLE 1 : Date / Heure / Prise en charge -->
<table class="t1">
  <tr>
    <td class="bg bold upper small c-lbl">Date de l'intervention</td>
    <td class="center c-val">${escapeHtml(dateDisplay)}</td>
    <td class="bg bold upper small c-lbl2">Heure d'entrée</td>
    <td class="center c-val2">${escapeHtml(interventionData.startTime || '………..…h………………')}</td>
    <td class="bg bold upper small center c-pec" rowspan="3">
      Prise en charge par<br/><br/>
      <span style="font-weight:400">${escapeHtml(interventionData.technicianName || '')}</span>
    </td>
  </tr>
  <tr>
    <td class="bg bold upper small c-lbl">Numéro de la fiche</td>
    <td class="center c-val">${escapeHtml(interventionData.ficheNumber || '')}</td>
    <td class="bg bold upper small c-lbl2">Heure de sortie</td>
    <td class="center c-val2">${escapeHtml(interventionData.endTime || '………..…h………………')}</td>
  </tr>
  <tr>
    <td class="bg bold upper small c-lbl">Site</td>
    <td class="center c-val">${escapeHtml(interventionData.siteName || '')}</td>
    <td class="bg bold upper small c-lbl2">TOTAL</td>
    <td class="center c-val2">${escapeHtml(interventionData.totalTime || '…………..….')}</td>
  </tr>
</table>

<!-- TABLE 2 : Type d'intervention -->
<table class="t2">
  <thead>
    <tr>
      <th class="bg t2-lbl">Type<br/>d'intervention</th>
      ${TYPES.map(t => `<th class="bg">${t}</th>`).join('')}
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="bg t2-lbl"></td>
      ${TYPES.map(t => `<td class="chk center">${t === currentType ? '&#10003;' : ''}</td>`).join('')}
    </tr>
  </tbody>
</table>

<!-- BLOC RÉSERVÉ À SOMACS SERVICE -->
<div class="bloc-res">
  <div class="res-bar"><span>Réservé à SOMACS SERVICE</span></div>
  <table class="res-tbl">
    <tr>
      <td class="bg bold upper small rl">Client</td>
      <td class="rv">${escapeHtml(interventionData.clientName || '')}</td>
      <td class="bg bold upper small rl2">Code client</td>
      <td class="rv2">${escapeHtml(interventionData.clientCode || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Adresse</td>
      <td colspan="3">${escapeHtml(interventionData.clientAddress || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Demandeur</td>
      <td class="rv">${escapeHtml(interventionData.requestorName || '')}</td>
      <td class="bg bold upper small rl2">Téléphone</td>
      <td class="rv2">${escapeHtml(interventionData.clientPhone || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">E-mail</td>
      <td colspan="3">${escapeHtml(interventionData.clientEmail || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Equipement</td>
      <td colspan="3">${escapeHtml(interventionData.machineType || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Marque</td>
      <td colspan="3">${escapeHtml(interventionData.machineBrand || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Modèle</td>
      <td colspan="3">${escapeHtml(interventionData.machineModel || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Numéro de série</td>
      <td colspan="3">${escapeHtml(interventionData.serialNumber || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Type de panne</td>
      <td colspan="3">${escapeHtml(interventionData.problemDescription || '')}</td>
    </tr>
  </table>
</div>

<!-- DÉTAIL DE L'INTERVENTION -->
<div class="bloc-det">
  <div class="det-title">Détail de l'intervention</div>
  <div class="det-diag">
    <span class="bold upper" style="text-decoration:underline">Diagnostic téléphonique</span>
    &nbsp;&nbsp;${escapeHtml(interventionData.telephoneDiagnostic || '')}
  </div>
  <div class="det-body">${escapeHtml(interventionData.interventionDetail || '')}</div>
  <div class="det-essai">
    <div class="de-lbl">Nombre d'essai</div>
    <div class="de-val">${escapeHtml(String(interventionData.numEssai || ''))}</div>
    <div class="de-space"></div>
    <div class="de-conc">
      <div class="de-lbl">Essai concluant</div>
      <div class="de-oui">${essaiOui ? '&#10003;&nbsp;' : ''}Oui</div>
      <div class="de-non">${essaiNon ? '&#10003;&nbsp;' : ''}Non</div>
    </div>
  </div>
</div>

<!-- LES ARTICLES UTILISÉS -->
<div class="bloc-art">
  <div class="art-bar"><span>Les articles utilisés</span></div>
  <table class="art-tbl">
    <thead>
      <tr>
        <th class="art-ref">Référence</th>
        <th>Désignation</th>
        <th class="art-qty">Quantité</th>
      </tr>
    </thead>
    <tbody>
      ${partRows6.map(p => `<tr>
        <td class="art-ref">${escapeHtml(p?.reference || '')}</td>
        <td>${escapeHtml(p?.designation || '')}</td>
        <td class="art-qty center">${escapeHtml(String(p?.quantity ?? ''))}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- PRIX M.O (HT) -->
<div class="prix-row">
  <div class="prix-box">
    <div class="prix-lbl">Prix M.O (HT) :</div>
    <div class="prix-val">${escapeHtml(String(laborPrice || ''))}</div>
  </div>
</div>

<!-- SIGNATURES -->
<div class="sig-row">
  <div class="sig-box">
    <div class="sig-ttl">Signature du technicien</div>
    <div class="sig-area"></div>
  </div>
  <div class="sig-box">
    <div class="sig-ttl">Signature et cachet client</div>
    <div class="sig-area"></div>
  </div>
</div>

<!-- FOOTER -->
<div class="ftr">
  <span>Adresse : 2/2 Rue El Fouledh ,Z.I &nbsp; Mégrine Riadh 2014 Ben Arous &nbsp;&nbsp;&nbsp; GSM : 98326746 &nbsp;&nbsp; Tel : 71296493</span>
  <span><strong>MF : 1420197A/A/M/000</strong></span>
</div>

</body>
</html>`
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=960,height=700')
    if (!printWindow) {
      alert("Impossible d'ouvrir la fenetre d'impression.")
      return
    }
    printWindow.document.open()
    printWindow.document.write(buildFichePrintHtml())
    printWindow.document.close()
    printWindow.focus()
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true)
    try {
      const response = await apiFetch(`/interventions/${id}/pdf`, { method: 'GET' })
      if (!response.ok) {
        alert('Erreur lors du telechargement du PDF.')
        return
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `fiche-intervention-${id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Impossible de telecharger le PDF.')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const handleSave = async (options = {}) => {
    setIsSaving(true)
    try {
      const isFinalSave = Boolean(options.finalize)
      const effectiveStatus = isFinalSave ? 'CLOSED' : status
      const effectiveCompletedUpTo = isFinalSave ? sections.length : completedUpTo
      const payload = {
        id,
        status: effectiveStatus,
        completedUpToSection: effectiveCompletedUpTo,
        technicianName: interventionData.technicianName,
        interventionDate: interventionData.interventionDate,
        ficheNumber: interventionData.ficheNumber,
        startTime: interventionData.startTime,
        endTime: interventionData.endTime,
        totalTime: interventionData.totalTime,
        siteName: interventionData.siteName,
        requestorName: interventionData.requestorName,
        clientId: interventionData.clientId || null,
        machineId: interventionData.machineId || null,
        problemDescription: interventionData.problemDescription,
        telephoneDiagnostic: interventionData.telephoneDiagnostic,
        interventionType: interventionData.interventionType,
        interventionDetail: interventionData.interventionDetail,
        numEssai: interventionData.numEssai,
        essaiConcluant: interventionData.essaiConcluant,
        parts,
        laborPrice: Number(laborPrice) || 0,
      }

      const response = await apiFetch(`/interventions/${id}`, {
        method: 'PATCH',
        body: payload,
      })
      if (!response.ok) {
        alert('Erreur lors de l’enregistrement.')
        return
      }
      const saved = await response.json().catch(() => null)
      if (saved) {
        setDbEntry(saved)
      }
      if (isFinalSave) {
        setStatus('CLOSED')
        setIsEditing(false)
      } else if (options.exitEdit) {
        setIsEditing(false)
      }
      if (options.returnTo) {
        try {
          const raw = window.localStorage.getItem('intervention_modified_ids')
          const list = raw ? JSON.parse(raw) : []
          const next = Array.isArray(list) ? list : []
          if (!next.includes(id)) {
            next.push(id)
            window.localStorage.setItem('intervention_modified_ids', JSON.stringify(next))
          }
        } catch {}
        navigate(options.returnTo)
        return
      }
      if (isFinalSave && missionId) {
        navigate(`/missions/${missionId}`)
      }
    } catch (error) {
      alert('Impossible de joindre le serveur.')
    } finally {
      setIsSaving(false)
    }
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 1:
        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                <Building2 className="text-[#0052CC]" size={24} />
                Informations Client & Équipement
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Coordonnées du client et identification de l’équipement concerné</p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <User size={12} className="text-[#0052CC]" />
                Identification Client
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                    <span className="w-1.5 h-1.5 bg-[#0052CC] rounded-full"></span>
                    Client
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={18} />
                    {isEmployeeHistoryEditFlow || isReadOnlyView ? (
                      <input
                        type="text"
                        value={interventionData.clientName || ''}
                        readOnly
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm"
                      />
                    ) : (
                      <select
                        name="clientId"
                        value={interventionData.clientId}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300"
                      >
                        <option value="">Sélectionner un client</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Code Client
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={18} />
                    <input type="text" name="clientCode" value={selectedClient?.code || interventionData.clientCode || ''} readOnly
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300" />
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Demandeur
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={18} />
                    <input type="text" name="requestorName" value={interventionData.requestorName} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300" />
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={18} />
                    <input type="tel" name="clientPhone" value={selectedClient?.phone || interventionData.clientPhone || ''} readOnly
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    E-mail
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={18} />
                    <input type="email" name="clientEmail" value={selectedClient?.email || interventionData.clientEmail || ''} readOnly
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Adresse
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={18} />
                    <textarea
                      name="clientAddress"
                      value={
                        selectedClient
                          ? String(selectedClient.address || '').trim() ||
                            `${selectedClient.city || ''}${selectedClient.zone ? `, ${selectedClient.zone}` : ''}`
                          : interventionData.clientAddress
                      }
                      readOnly
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold h-20 sm:h-24 resize-none shadow-sm hover:border-slate-300 leading-relaxed" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Site / Localisation
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={18} />
                    <input
                      type="text"
                      name="siteName"
                      value={interventionData.siteName || ''}
                      onChange={handleChange}
                      readOnly={Boolean(isReadOnlyView || !isEditing)}
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Settings size={12} className="text-orange-500" />
                Fiche Technique Équipement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-orange-500 transition-colors">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    Équipement
                  </label>
                  <div className="relative">
                    <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                    {isEmployeeHistoryEditFlow || isReadOnlyView ? (
                      <input
                        type="text"
                        value={interventionData.machineType || ''}
                        readOnly
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm"
                      />
                    ) : (
                      <select
                        name="machineId"
                        value={interventionData.machineId}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300"
                      >
                        <option value="">Sélectionner une machine</option>
                        {machines.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.designation}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-orange-500 transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Marque
                  </label>
                  <input type="text" name="machineBrand" value={selectedMachine?.brand || interventionData.machineBrand || ''} readOnly
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300" />
                </div>
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-orange-500 transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Modèle
                  </label>
                  <input
                    type="text"
                    name="machineModel"
                    value={
                      selectedMachine
                        ? String(selectedMachine.model || '').trim()
                          ? selectedMachine.model
                          : selectedMachine.year
                        : interventionData.machineModel
                    }
                    readOnly
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300" />
                </div>
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-orange-500 transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Numéro de Série
                  </label>
                  <div className="relative">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input type="text" name="serialNumber" value={selectedMachine?.serialNumber || interventionData.serialNumber || ''} readOnly
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-bold font-mono tracking-wider shadow-sm hover:border-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                <AlertCircle className="text-blue-600" size={24} />
                Détail de l’Intervention
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Diagnostic, rapport d’expertise et détail des travaux effectués</p>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-2 sm:space-y-3 group">
                <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-blue-600 transition-colors">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  Type d’Intervention
                </label>
                <select name="interventionType" value={interventionData.interventionType} onChange={handleChange}
                  className="w-full px-4 py-3 sm:py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-bold text-sm sm:text-base text-blue-700 appearance-none cursor-pointer shadow-sm hover:border-slate-300"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                  <option value="Réparation">{'🔧'} Réparation</option>
                  <option value="Installation">{'⚡'} Installation</option>
                  <option value="Garantie">{'🛡️'} Sous Garantie</option>
                  <option value="Devis">{'📄'} Établissement Devis</option>
                  <option value="Formation">{'🎓'} Formation</option>
                  <option value="Livraison">{'📦'} Livraison</option>
                </select>
              </div>

              <div className="space-y-2 sm:space-y-3 group">
                <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-blue-600 transition-colors">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  Type de panne
                </label>
                <div className="relative">
                  <textarea name="problemDescription" value={interventionData.problemDescription} onChange={handleChange}
                    placeholder="Décrivez précisément le type de panne constaté..."
                    className="w-full px-4 py-3 sm:py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-medium h-24 sm:h-28 resize-none leading-relaxed shadow-sm hover:border-slate-300" />
                  <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-semibold">
                    {interventionData.problemDescription.length} caractères
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3 group">
                <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-blue-600 transition-colors">
                  <PhoneCall size={12} className="text-blue-600" />
                  Diagnostic Téléphonique
                </label>
                <textarea name="telephoneDiagnostic" value={interventionData.telephoneDiagnostic} onChange={handleChange}
                  placeholder="Résumé du diagnostic réalisé par téléphone avant l’intervention sur site..."
                  className="w-full px-4 py-3 sm:py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-medium h-28 sm:h-32 resize-none leading-relaxed shadow-sm hover:border-slate-300" />
              </div>

              <div className="space-y-2 sm:space-y-3 group">
                <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-blue-600 transition-colors">
                  <Wrench size={12} className="text-blue-600" />
                  Solution d'intervention
                </label>
                <textarea name="interventionDetail" value={interventionData.interventionDetail} onChange={handleChange}
                  placeholder="Décrivez précisément les actions correctives réalisées sur l’équipement..."
                  className="w-full px-4 py-3 sm:py-4 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-medium min-h-[140px] sm:min-h-[160px] resize-none leading-relaxed shadow-sm hover:border-slate-300" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-blue-600 transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Nombre d’Essai
                  </label>
                  <input type="number" name="numEssai" value={interventionData.numEssai} onChange={handleChange} min="0" step="1"
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-bold shadow-sm hover:border-slate-300" />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Essai Concluant
                  </label>
                  <div className="flex gap-2 sm:gap-3">
                    <button type="button"
                      onClick={() => setInterventionData(prev => ({ ...prev, essaiConcluant: true }))}
                      className={`flex-1 py-3 sm:py-3.5 rounded-xl font-black text-[11px] sm:text-sm uppercase tracking-wider transition-all border-2 ${
                        interventionData.essaiConcluant === true 
                          ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}>
                      ✓ Oui
                    </button>
                    <button type="button"
                      onClick={() => setInterventionData(prev => ({ ...prev, essaiConcluant: false }))}
                      className={`flex-1 py-3 sm:py-3.5 rounded-xl font-black text-[11px] sm:text-sm uppercase tracking-wider transition-all border-2 ${
                        interventionData.essaiConcluant === false 
                          ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}>
                      ✕ Non
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-green-600 transition-colors">
                    <Clock size={12} className="text-green-600" />
                    Entrée
                  </label>
                  <input type="time" name="startTime" value={interventionData.startTime} onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:ring-4 focus:ring-green-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-bold shadow-sm hover:border-slate-300" />
                </div>
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-green-600 transition-colors">
                    <Clock size={12} className="text-green-600" />
                    Sortie
                  </label>
                  <input type="time" name="endTime" value={interventionData.endTime} onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:ring-4 focus:ring-green-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-bold shadow-sm hover:border-slate-300" />
                </div>
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-green-600 transition-colors">
                    <Clock size={12} className="text-green-600" />
                    Total
                  </label>
                  <input type="text" name="totalTime" value={interventionData.totalTime} readOnly
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:ring-4 focus:ring-green-600/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-bold shadow-sm hover:border-slate-300" />
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                <Package className="text-purple-600" size={24} />
                Articles Utilisés & Tarification
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Gérez les pièces consommables et le coût de main d’œuvre</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-wider">{parts.length} Référence{parts.length > 1 ? 's' : ''}</span>
                </div>
                <button onClick={addPart}
                  className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-[#0052CC] hover:bg-[#0052CC]/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all border border-blue-200">
                  <Plus size={14} /> Ajouter
                </button>
              </div>

              {/* Mobile Card Layout for Parts */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {parts.map((part) => (
                  <div key={part.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <input type="text" value={part.reference} onChange={(e) => updatePart(part.id, 'reference', e.target.value)}
                          placeholder="Référence"
                          className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#0052CC] outline-none" />
                        <input type="text" value={part.designation} onChange={(e) => updatePart(part.id, 'designation', e.target.value)}
                          placeholder="Désignation"
                          className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none" />
                      </div>
                      <button onClick={() => removePart(part.id)}
                        className="p-2 text-slate-300 hover:text-red-500 ml-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantité:</span>
                      <input type="number" value={part.quantity} onChange={(e) => updatePart(part.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-20 bg-slate-50 rounded-lg px-3 py-1.5 text-center font-black text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#0052CC]/20" />
                    </div>
                  </div>
                ))}
                {parts.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={24} className="text-slate-200" />
                      <p className="text-xs font-semibold text-slate-400">Aucun article</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Table Layout for Parts */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-4">Référence</th>
                      <th className="px-6 py-4">Désignation</th>
                      <th className="px-6 py-4 w-28 text-center">Quantité</th>
                      <th className="px-6 py-4 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {parts.map((part) => (
                      <tr key={part.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <input type="text" value={part.reference} onChange={(e) => updatePart(part.id, 'reference', e.target.value)}
                            placeholder="REF-..."
                            className="w-full bg-transparent border-none p-0 focus:ring-0 font-mono font-bold text-[#0052CC] outline-none" />
                        </td>
                        <td className="px-6 py-4">
                          <input type="text" value={part.designation} onChange={(e) => updatePart(part.id, 'designation', e.target.value)}
                            placeholder="Désignation de l’article"
                            className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-600 outline-none" />
                        </td>
                        <td className="px-6 py-4">
                          <input type="number" value={part.quantity} onChange={(e) => updatePart(part.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-50 rounded-lg px-3 py-1 text-center font-black text-slate-700 outline-none focus:ring-2 focus:ring-[#0052CC]/20" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => removePart(part.id)}
                            className="p-2 text-slate-200 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {parts.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Package size={24} className="text-slate-200" />
                            <p className="text-sm font-semibold text-slate-400">Aucun article ajouté</p>
                            <p className="text-xs text-slate-300">Cliquez sur “Ajouter une Référence” pour commencer</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Prix Main d’Œuvre (HT)</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Coût de la main d’œuvre hors taxes</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <input type="number" value={laborPrice} onChange={(e) => setLaborPrice(e.target.value)}
                    className="w-full sm:w-32 bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-right font-black text-white focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none text-base sm:text-lg" />
                  <span className="text-base sm:text-lg font-black text-slate-400">DT</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="pb-4 sm:pb-6 border-b-2 border-slate-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <ClipboardCheck size={20} className="sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900">Signatures & Clôture</h2>
                  <p className="text-[10px] sm:text-sm text-slate-500 font-medium">Validez les signatures et clôturez le dossier</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-2xl border-2 border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b-2 border-blue-200">
                  <Building2 className="text-blue-600" size={18} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900">Client</span>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Client</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">{interventionData.clientName}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Demandeur</p>
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-700">{interventionData.requestorName}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Téléphone</p>
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-600">{interventionData.clientPhone}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 sm:p-6 rounded-2xl border-2 border-orange-100 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b-2 border-orange-200">
                  <Settings className="text-orange-600" size={18} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-900">Équipement</span>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">Équipement</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">{interventionData.machineType}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">Marque / Modèle</p>
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-700">{interventionData.machineBrand} {interventionData.machineModel}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">N° de Série</p>
                    <p className="text-[10px] sm:text-xs font-mono font-bold text-slate-600 tracking-wider">{interventionData.serialNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 rounded-2xl border-2 border-purple-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <AlertCircle className="text-purple-600" size={18} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-900">Type : {interventionData.interventionType}</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold w-fit ${statusConfig[status].color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[status].dot}`}></span>
                  {statusConfig[status].label}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-purple-900 leading-relaxed italic bg-white/50 p-3 sm:p-4 rounded-xl">
                "{interventionData.problemDescription}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Signature du Technicien</p>
                <div className="aspect-[2.5/1] sm:aspect-[2/1] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center group hover:border-[#0052CC] transition-all cursor-pointer">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase group-hover:text-[#0052CC] transition-colors text-center px-4">Cliquer pour signer</span>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Signature et Cachet Client</p>
                <div className="aspect-[2.5/1] sm:aspect-[2/1] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center group hover:border-[#0052CC] transition-all cursor-pointer">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase group-hover:text-[#0052CC] transition-colors text-center px-4">Signature Client</span>
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-x-hidden overflow-hidden">
      {/* --- HEADER --- */}
      <div className="bg-white border-b-2 border-slate-200 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            onClick={() => {
              if (isEmployeeHistoryEditFlow && returnTo) {
                navigate(returnTo)
                return
              }
              if (location.state?.fromMissionDetails && missionId) {
                navigate(`/missions/${missionId}`)
                return
              }
              navigate('/interventions')
            }}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            <ChevronLeft size={20} className="sm:hidden" strokeWidth={2.5} />
            <ChevronLeft size={24} className="hidden sm:block" strokeWidth={2.5} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight truncate">
                <span className="hidden sm:inline">Dossier </span>{interventionData.ficheNumber}
              </h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm w-fit ${statusConfig[status].color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[status].dot}`}></span>
                {statusConfig[status].label}
              </span>
            </div>
            <p className="text-slate-500 text-[10px] sm:text-sm font-semibold mt-0.5 flex items-center gap-2 truncate">
              <Calendar size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span className="truncate">Gestion du dossier SAV</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex flex-col items-end text-right mr-4 pr-4 border-r-2 border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technicien</span>
            <span className="text-sm font-black text-slate-700">{interventionData.technicianName || 'Non assigné'}</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Printer size={18} />
              <span className="hidden md:inline">Imprimer</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FileText size={16} />
              <span>{isDownloadingPdf ? 'Generation...' : 'PDF'}</span>
            </button>
          </div>
          
          {isEmployeeHistoryEditFlow ? (
            <>
              <button
                type="button"
                onClick={() => handleSave({ exitEdit: true, returnTo })}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 bg-gradient-to-r from-[#0052CC] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-200 hover:shadow-blue-300"
              >
                <PenTool size={18} />
                <span className="hidden md:inline">Modifier</span>
              </button>
            </>
          ) : isReadOnlyView ? null : (
            <button
              onClick={() => {
                if (status === 'CLOSED') return
                handleSave()
              }}
              disabled={isSaving || status === 'CLOSED'}
              className={`flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 ${
                status === 'CLOSED'
                  ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-slate-300'
                  : 'bg-gradient-to-r from-[#0052CC] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-200 hover:shadow-blue-300'
              }`}
            >
              <Save size={18} />
              <span className="hidden md:inline">{status === 'CLOSED' ? 'Clôturée' : 'Enregistrer'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col min-w-0">
        {/* --- HORIZONTAL STEPPER (MOBILE/TABLET) --- */}
        <div className={`${useHorizontalProgress ? 'bg-white border-b border-slate-100 px-4 py-3 shrink-0' : 'lg:hidden bg-white border-b border-slate-100 px-4 py-3 shrink-0'}`}>
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {sections.map((section, idx) => {
              const isActive = activeSection === section.id
              const isCompleted = activeSection > section.id
              const Icon = section.icon
              
              return (
                <React.Fragment key={section.id}>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-200 scale-110'
                        : isCompleted ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wide ${isActive ? 'text-[#0052CC]' : isCompleted ? 'text-green-500' : 'text-slate-400'}`}>
                      {section.title}
                    </span>
                  </div>
                  {idx < sections.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors duration-300 ${activeSection > section.id ? 'bg-green-400' : 'bg-slate-100'}`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-w-0">

        {/* --- SIDEBAR (DESKTOP) --- */}
        <div className={`${useHorizontalProgress ? 'hidden' : 'hidden lg:flex w-[320px] border-r border-slate-50 bg-slate-50/30 flex-col p-8 shrink-0 min-w-0'}`}>
          <div className="space-y-2 mb-12">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Progression</h4>
            <div className="h-1 w-12 bg-[#0052CC] rounded-full"></div>
          </div>
          
          <div className="space-y-1">
            {sections.map((section) => {
              const isActive = activeSection === section.id
              const isCompleted = activeSection > section.id
              const Icon = section.icon
              
              return (
                <div key={section.id} className="relative pb-10 last:pb-0">
                  {section.id !== sections.length && (
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
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 transition-colors ${isActive ? 'text-[#0052CC]' : 'text-slate-300'}`}>Étape 0{section.id}</p>
                      <p className={`text-base font-black tracking-tight transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{section.title}</p>
                      <p className={`text-[11px] font-bold mt-0.5 transition-colors ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>{section.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-auto bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Zap size={16} className="text-orange-400 fill-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rappel SAV</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">"Complétez le diagnostic et les articles utilisés avant de clôturer le dossier."</p>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white flex flex-col relative min-w-0">
          <div className="flex-1 px-4 sm:px-8 md:px-12 py-8 sm:py-12 md:py-16 max-w-4xl mx-auto w-full min-w-0">
            <div className="h-full flex flex-col">
              <div className="flex-1">
                <fieldset disabled={isReadOnlyView || (status === 'CLOSED' && !isEditing)} className="contents">
                  {renderSectionContent()}
                </fieldset>
              </div>

              {isEmployeeHistoryEditFlow && activeSection === sections.length ? (
                <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t-2 border-slate-200 flex flex-col gap-3 shrink-0">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setActiveSection(prev => Math.max(prev - 1, 1))}
                        disabled={activeSection === 1}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all ${
                          activeSection === 1 
                            ? 'text-slate-300 cursor-not-allowed' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 shadow-sm hover:shadow-md border border-slate-200 sm:border-none'
                        }`}
                      >
                        <ChevronLeft size={18} />
                        <span className="sm:inline">Précédent</span>
                      </button>

                      <button
                        onClick={() => setShowMobilePreview(true)}
                        className="xl:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                      >
                        <Eye size={18} />
                        Aperçu
                      </button>
                    </div>
                  </div>

                  <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSave({ exitEdit: true, returnTo })}
                      disabled={isSaving}
                      className="w-full sm:w-72 flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-4.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-[#0052CC] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-200 hover:shadow-blue-300"
                    >
                      <PenTool size={18} />
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(returnTo)}
                      className="w-full sm:w-72 flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-4.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm active:scale-95 bg-[#F7F3E8] hover:bg-[#F1E8D4] text-slate-700 border border-[#E9DEC4]"
                    >
                      <XCircle size={18} />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                  <div className="flex items-center gap-3 w-full sm:w-auto order-2 sm:order-1">
                    <button
                      type="button"
                      onClick={() => setActiveSection(prev => Math.max(prev - 1, 1))}
                      disabled={activeSection === 1}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all ${
                        activeSection === 1 
                          ? 'text-slate-300 cursor-not-allowed' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 shadow-sm hover:shadow-md border border-slate-200 sm:border-none'
                      }`}
                    >
                      <ChevronLeft size={18} />
                      <span className="sm:inline">Précédent</span>
                    </button>

                    <button
                      onClick={() => setShowMobilePreview(true)}
                      className="xl:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                    >
                      <Eye size={18} />
                      Aperçu
                    </button>
                  </div>
                  
                  {activeSection < sections.length ? (
                    <button
                      type="button"
                      onClick={() => setActiveSection(prev => Math.min(prev + 1, sections.length))}
                      className="w-full sm:w-auto order-1 sm:order-2 group flex items-center justify-center gap-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-[#0052CC] hover:to-blue-700 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-slate-300 hover:shadow-blue-300 active:scale-95"
                    >
                      Continuer
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                    </button>
                  ) : (
                    isReadOnlyView ? (
                      <button
                        type="button"
                        onClick={() => navigate('/interventions')}
                        className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm active:scale-95 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                      >
                        <ChevronLeft size={18} />
                        Retour
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (status === 'CLOSED') return
                          handleSave({ finalize: true })
                        }}
                        disabled={isSaving || status === 'CLOSED'}
                        className={`w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                          status === 'CLOSED'
                            ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-slate-300'
                            : 'bg-gradient-to-r from-[#0052CC] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-200 hover:shadow-blue-300'
                        }`}
                      >
                        <Save size={18} />
                        {status === 'CLOSED' ? 'Clôturée' : 'Enregistrer'}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- DESKTOP PREVIEW --- */}
        <div className="hidden xl:flex w-[620px] bg-slate-100 border-l border-slate-200 flex-col items-center justify-start overflow-y-auto no-scrollbar py-8 px-6 min-w-0">
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Aperçu de la fiche officielle</h4>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0052CC]"></div>
              </div>
            </div>
            
            <div className="w-full bg-white shadow-2xl rounded-none px-7 pt-5 pb-8 relative transition-all duration-700 overflow-hidden border border-slate-300 text-slate-900 leading-none" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <FicheContent
                interventionData={interventionData}
                parts={parts}
                laborPrice={laborPrice}
                logo={logo}
              />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* --- MOBILE PREVIEW MODAL --- */}
      {showMobilePreview && (
        <MobilePreviewModal
          onClose={() => setShowMobilePreview(false)}
          interventionData={interventionData}
          parts={parts}
          laborPrice={laborPrice}
          logo={logo}
        />
      )}
    </div>
  )
}
