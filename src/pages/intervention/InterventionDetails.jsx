import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  Eye
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
    return () => window.removeEventListener('resize', computeScale)
  }, [computeScale])

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 xl:hidden animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl h-[92vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
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

  // Load the matching intervention from the DB (or fall back to INT-2026-001)
  const dbEntry = interventionsDB[id] || interventionsDB['INT-2026-001']
  const completedUpTo = dbEntry.completedUpToSection

  const [activeSection, setActiveSection] = useState(() => statusToSection[dbEntry.status] || 1)
  const [status, setStatus] = useState(dbEntry.status || 'PENDING')
  const [laborPrice, setLaborPrice] = useState(dbEntry.laborPrice || 0)
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [interventionData, setInterventionData] = useState({
    interventionDate: dbEntry.interventionDate,
    ficheNumber: dbEntry.ficheNumber,
    startTime: dbEntry.startTime,
    endTime: dbEntry.endTime,
    totalTime: dbEntry.totalTime,
    siteName: dbEntry.siteName,
    clientName: dbEntry.clientName,
    clientCode: dbEntry.clientCode,
    clientPhone: dbEntry.clientPhone,
    clientEmail: dbEntry.clientEmail,
    clientAddress: dbEntry.clientAddress,
    requestorName: dbEntry.requestorName,
    machineType: dbEntry.machineType,
    machineBrand: dbEntry.machineBrand,
    machineModel: dbEntry.machineModel,
    serialNumber: dbEntry.serialNumber,
    problemDescription: dbEntry.problemDescription,
    telephoneDiagnostic: dbEntry.telephoneDiagnostic,
    interventionType: dbEntry.interventionType,
    interventionDetail: dbEntry.interventionDetail,
    numEssai: dbEntry.numEssai,
    essaiConcluant: dbEntry.essaiConcluant,
    technicianName: dbEntry.technicianName,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setInterventionData(prev => ({ ...prev, [name]: value }))
  }

  const [parts, setParts] = useState(dbEntry.parts || [])

  const addPart = () => {
    setParts([...parts, { id: Date.now(), reference: '', designation: '', quantity: 1 }])
  }

  const removePart = (partId) => {
    setParts(parts.filter(p => p.id !== partId))
  }

  const updatePart = (partId, field, value) => {
    setParts(parts.map(p => p.id === partId ? { ...p, [field]: value } : p))
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
                    <input type="text" name="clientName" value={interventionData.clientName} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300" />
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-[#0052CC] transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Code Client
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" size={18} />
                    <input type="text" name="clientCode" value={interventionData.clientCode} onChange={handleChange}
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
                    <input type="tel" name="clientPhone" value={interventionData.clientPhone} onChange={handleChange}
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
                    <input type="email" name="clientEmail" value={interventionData.clientEmail} onChange={handleChange}
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
                    <textarea name="clientAddress" value={interventionData.clientAddress} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-[#0052CC]/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold h-20 sm:h-24 resize-none shadow-sm hover:border-slate-300 leading-relaxed" />
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
                    <input type="text" name="machineType" value={interventionData.machineType} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300" />
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-orange-500 transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Marque
                  </label>
                  <input type="text" name="machineBrand" value={interventionData.machineBrand} onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300" />
                </div>
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-orange-500 transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Modèle
                  </label>
                  <input type="text" name="machineModel" value={interventionData.machineModel} onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm sm:text-base text-slate-800 font-semibold shadow-sm hover:border-slate-300" />
                </div>
                <div className="space-y-2 sm:space-y-3 group">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 group-focus-within:text-orange-500 transition-colors">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    Numéro de Série
                  </label>
                  <div className="relative">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input type="text" name="serialNumber" value={interventionData.serialNumber} onChange={handleChange}
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
                  <input type="text" name="numEssai" value={interventionData.numEssai} onChange={handleChange}
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
                  <input type="text" name="totalTime" value={interventionData.totalTime} onChange={handleChange}
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* --- HEADER --- */}
      <div className="bg-white border-b-2 border-slate-200 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            onClick={() => navigate('/interventions')}
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
          
          <button className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md active:scale-95">
            <Printer size={18} /> 
            <span className="hidden md:inline">Imprimer</span>
          </button>
          
          <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#0052CC] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-95">
            <Save size={18} /> 
            <span className="hidden md:inline">Enregistrer</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* --- HORIZONTAL STEPPER (MOBILE/TABLET) --- */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-2 min-w-max mx-auto">
            {sections.map((section, idx) => {
              const isActive = activeSection === section.id
              const isDone = completedUpTo >= section.id && !isActive
              const Icon = section.icon
              
              return (
                <React.Fragment key={section.id}>
                  <div 
                    onClick={() => setActiveSection(section.id)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#0052CC] text-white shadow-md scale-105' 
                        : isDone
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isDone ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-[#0052CC]' : isDone ? 'text-green-500' : 'text-slate-400'}`}>
                      {section.title}
                    </span>
                  </div>
                  {idx < sections.length - 1 && (
                    <div className={`w-4 h-0.5 rounded-full mb-4 ${completedUpTo > section.id ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* --- SIDEBAR (DESKTOP) --- */}
        <div className="hidden lg:flex w-[320px] border-r border-slate-50 bg-slate-50/30 flex-col p-8 shrink-0">
          <div className="space-y-2 mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sections</h4>
            <div className="h-1 w-12 bg-[#0052CC] rounded-full"></div>
          </div>
          
          <div className="space-y-1">
            {sections.map((section) => {
              const isActive = activeSection === section.id
              const isDone = completedUpTo >= section.id && !isActive
              const Icon = section.icon
              
              return (
                <div key={section.id} className="relative pb-10 last:pb-0">
                  {section.id !== sections.length && (
                    <div className={`absolute left-6 top-14 bottom-0 w-0.5 rounded-full ${completedUpTo >= section.id ? 'bg-[#0052CC]' : 'bg-slate-100'}`}></div>
                  )}
                  
                  <div 
                    className="flex items-start gap-5 group cursor-pointer"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 z-10 ${
                      isActive 
                        ? 'bg-[#0052CC] text-white shadow-xl shadow-blue-200 scale-110' 
                        : isDone
                          ? 'bg-green-500 text-white shadow-lg shadow-green-100'
                          : 'bg-white text-slate-300 border-2 border-slate-50 group-hover:border-slate-200'
                    }`}>
                      {isDone ? <Check size={20} className="stroke-[4px]" /> : <Icon size={20} className={isActive ? 'stroke-[3px]' : 'stroke-[2px]'} />}
                    </div>
                    <div className="pt-1">
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 transition-colors ${isActive ? 'text-[#0052CC]' : isDone ? 'text-green-500' : 'text-slate-300'}`}>Section 0{section.id}</p>
                      <p className={`text-base font-black tracking-tight transition-colors ${isActive ? 'text-slate-900' : isDone ? 'text-slate-600' : 'text-slate-400'}`}>{section.title}</p>
                      <p className={`text-[11px] font-bold mt-0.5 transition-colors ${isActive ? 'text-slate-500' : isDone ? 'text-slate-400' : 'text-slate-300'}`}>{section.description}</p>
                      {isDone && <span className="text-[9px] font-black text-green-500 uppercase tracking-wider">✓ Complété</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modifier le Statut</p>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-xs uppercase tracking-widest text-[#0052CC] outline-none focus:border-[#0052CC] transition-all cursor-pointer"
            >
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
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
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white flex flex-col relative">
          {/* Mobile Status Selector (floating or bottom) */}
          <div className="lg:hidden flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-orange-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Statut</span>
            </div>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-transparent border-none font-black text-[10px] uppercase tracking-widest text-[#0052CC] outline-none focus:ring-0 cursor-pointer"
            >
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 px-4 sm:px-8 md:px-12 py-8 sm:py-12 md:py-16 max-w-4xl mx-auto w-full">
            <div className="h-full flex flex-col">
              <div className="flex-1">
                {renderSectionContent()}
              </div>

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
                  <button
                    type="button"
                    onClick={() => navigate('/interventions')}
                    className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-10 sm:px-12 py-4 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-green-300 active:scale-95"
                  >
                    <Check size={18} strokeWidth={3} />
                    Valider & Clôturer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- DESKTOP PREVIEW --- */}
        <div className="hidden xl:flex w-[620px] bg-slate-100 border-l border-slate-200 flex-col items-center justify-start overflow-y-auto no-scrollbar py-8 px-6">
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
