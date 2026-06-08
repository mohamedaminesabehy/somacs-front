import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Building2, Calendar, CheckCircle2, Edit3, Eye, FileText, Hash, History, Printer, Search, User, Wrench, X } from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import logo from '../../assets/logo.jpg'

const statusBadgeByStatus = {
  CLOSED: 'bg-green-50 text-green-700 border-green-200',
}

function getAuthUser() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem('auth_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function normalizeIntervention(row) {
  const status = row?.status || ''
  const technicianName =
    row?.technicianName ||
    row?.assignedTo ||
    row?.assignee ||
    row?.technician ||
    ''
  const clientName =
    row?.clientName ||
    row?.client ||
    row?.clientEntity?.name ||
    ''
  const machine =
    row?.machineType ||
    row?.machineModel ||
    row?.machine ||
    ''
  const siteName = row?.siteName || row?.site || ''
  const interventionDate = row?.interventionDate || row?.date || ''
  const ficheNumber = row?.ficheNumber || ''

  return {
    id: row?.id,
    status,
    technicianName,
    assignedEmployeesDisplay: row?.assignedEmployeesDisplay || technicianName,
    missionId: row?.missionId || null,
    clientName,
    machine,
    siteName,
    interventionDate,
    ficheNumber,
    raw: row,
  }
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

function mapRawToInterventionData(raw) {
  const clientEntity = raw?.clientEntity || null
  const machineEntity = raw?.machineEntity || null

  return {
    interventionDate: raw?.interventionDate || raw?.date || '',
    startTime: raw?.startTime || '',
    endTime: raw?.endTime || '',
    totalTime: raw?.totalTime || '',
    technicianName: raw?.assignedEmployeesDisplay || raw?.technicianName || raw?.assignedTo || raw?.assignee || raw?.technician || '',
    ficheNumber: raw?.ficheNumber || '',
    siteName: raw?.siteName || raw?.site || machineEntity?.site || '',
    clientName: raw?.clientName || raw?.client || clientEntity?.name || '',
    clientCode: raw?.clientCode || clientEntity?.code || '',
    clientPhone: raw?.clientPhone || raw?.phone || clientEntity?.phone || '',
    clientEmail: raw?.clientEmail || clientEntity?.email || '',
    clientAddress: raw?.clientAddress || formatClientAddress(clientEntity) || '',
    requestorName: raw?.requestorName || '',
    machineType: raw?.machineType || raw?.machine || machineEntity?.designation || '',
    machineBrand: raw?.machineBrand || machineEntity?.brand || '',
    machineModel: raw?.machineModel || machineEntity?.year || '',
    serialNumber: raw?.serialNumber || machineEntity?.serialNumber || '',
    problemDescription: raw?.problemDescription || raw?.request || '',
    telephoneDiagnostic: raw?.telephoneDiagnostic || '',
    interventionType: raw?.interventionType || raw?.type || '',
    interventionDetail: raw?.interventionDetail || '',
    numEssai: raw?.numEssai || '',
    essaiConcluant: raw?.essaiConcluant ?? null,
  }
}

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

function InterventionPreview({ intervention }) {
  const data = intervention?.raw || {}
  const parts = Array.isArray(data.parts) ? data.parts : []
  const laborPrice = typeof data.laborPrice === 'number' ? data.laborPrice : Number(data.laborPrice) || 0
  const interventionData = mapRawToInterventionData(data)

  const FICHE_WIDTH = 560
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
    <div ref={wrapperRef} className="flex-1 overflow-y-auto bg-slate-100 no-scrollbar p-3">
      <div style={{ width: `${FICHE_WIDTH * scale}px`, height: `${Math.round(FICHE_WIDTH * scale * 1.414)}px`, margin: '0 auto' }}>
        <div style={{ width: `${FICHE_WIDTH}px`, transformOrigin: 'top left', transform: `scale(${scale})` }}>
          <div className="bg-white shadow-2xl rounded-none px-7 pt-5 pb-8 relative transition-all duration-700 overflow-hidden border border-slate-300 text-slate-900 leading-none" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <FicheContent interventionData={interventionData} parts={parts} laborPrice={laborPrice} logo={logo} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EmployeeHistory() {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [isLoading, setIsLoading] = useState(true)
  const [employeeName, setEmployeeName] = useState('')
  const [resolvedRole, setResolvedRole] = useState('')
  const [interventions, setInterventions] = useState([])

  const [searchTerm, setSearchTerm] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [showDetails, setShowDetails] = useState(false)
  const [selected, setSelected] = useState(null)
  const printRef = useRef(null)
  const [highlightId, setHighlightId] = useState('')
  const highlightTimerRef = useRef(null)
  const highlightRowRef = useRef(null)
  const modifiedIdsSet = useMemo(() => {
    try {
      const raw = window.localStorage.getItem('intervention_modified_ids')
      const list = raw ? JSON.parse(raw) : []
      return new Set(Array.isArray(list) ? list : [])
    } catch {
      return new Set()
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const fromQuery = params.get('highlight') || ''
    const fromState = location.state?.highlightInterventionId || ''
    const next = String(fromQuery || fromState || '')
    if (!next) return

    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = null
    }
    setHighlightId(next)
    window.setTimeout(() => {
      if (highlightRowRef.current?.scrollIntoView) {
        highlightRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 50)
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightId('')
      highlightTimerRef.current = null
    }, 1800)

    if (fromQuery) {
      navigate({ pathname: location.pathname, search: '' }, { replace: true, state: location.state })
    }

    return () => {
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = null
    }
  }, [location.pathname, location.search, location.state, navigate])

  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      try {
        let resolvedEmployeeName = ''
        let isMe = employeeId === 'me'
        const usersRes = await apiFetch('/users')
        if (usersRes.ok) {
          const users = await usersRes.json()
          const list = Array.isArray(users) ? users : []
          let found = null
          if (isMe) {
            const authUser = getAuthUser()
            if (authUser?.id) found = list.find((u) => String(u.id) === String(authUser.id))
          } else {
            found = list.find((u) => String(u.id) === String(employeeId))
          }
          resolvedEmployeeName = found?.name || ''
          setEmployeeName(resolvedEmployeeName)
          setResolvedRole(found?.role || '')
        }

        const [interventionsRes, missionsRes] = await Promise.all([
          apiFetch('/interventions', { auth: true, cache: 'no-store' }),
          apiFetch('/missions', { auth: true, cache: 'no-store' }),
        ])
        if (!interventionsRes.ok) {
          setInterventions([])
          return
        }
        const data = await interventionsRes.json()
        const missionsData = missionsRes.ok ? await missionsRes.json().catch(() => []) : []
        const list = Array.isArray(data) ? data : []
        const missionsList = Array.isArray(missionsData) ? missionsData : []

        const missionAggregateByIntervention = new Map()
        for (const mission of missionsList) {
          const interventionId = mission?.interventionId
          if (!interventionId) continue
          const key = String(interventionId)
          if (!missionAggregateByIntervention.has(key)) {
            missionAggregateByIntervention.set(key, { names: new Set(), missionId: mission?.id || null })
          }
          const aggregate = missionAggregateByIntervention.get(key)
          const names = buildAssignedEmployeesDisplay(mission)
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean)
          names.forEach((name) => aggregate.names.add(name))
          if (!aggregate.missionId && mission?.id) aggregate.missionId = mission.id
        }

        const normalized = list.map((row) => {
          const aggregate = missionAggregateByIntervention.get(String(row?.id || ''))
          const assignedEmployeesDisplay =
            aggregate && aggregate.names.size > 0
              ? Array.from(aggregate.names).join(', ')
              : String(row?.technicianName || row?.assignedTo || row?.assignee || row?.technician || '')
          return normalizeIntervention({
            ...row,
            assignedEmployeesDisplay,
            missionId: aggregate?.missionId || null,
          })
        })
        const closed = normalized.filter((row) => String(row.status).toUpperCase() === 'CLOSED')
        const byEmployee = resolvedEmployeeName
          ? closed.filter((row) => {
              const target = String(resolvedEmployeeName).trim()
              const names = String(row.assignedEmployeesDisplay || row.technicianName || '')
                .split(',')
                .map((name) => name.trim())
                .filter(Boolean)
              return names.includes(target)
            })
          : closed
        setInterventions(byEmployee)
      } catch {
        setInterventions([])
      } finally {
        setIsLoading(false)
      }
    })()
  }, [employeeId])

  const filtered = useMemo(() => {
    return interventions.filter((row) => {
      if (fromDate && row.interventionDate && String(row.interventionDate) < fromDate) return false
      if (toDate && row.interventionDate && String(row.interventionDate) > toDate) return false
      if (searchTerm) {
        const t = searchTerm.toLowerCase()
        const hay = `${row.id} ${row.ficheNumber} ${row.clientName} ${row.machine} ${row.siteName}`.toLowerCase()
        if (!hay.includes(t)) return false
      }
      return true
    })
  }, [interventions, fromDate, toDate, searchTerm])

  const handleOpenDetails = (row) => {
    setSelected(row)
    setShowDetails(true)
  }

  const handleCloseDetails = () => {
    setShowDetails(false)
    setSelected(null)
  }

  useEffect(() => {
    if (!showDetails) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [showDetails])

  const handlePrint = () => {
    if (!printRef.current) return
    const html = printRef.current.innerHTML
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(`<!doctype html><html><head><title>Fiche SAV</title><meta charset="utf-8" />`)
    win.document.write(`<style>body{font-family:Arial,Helvetica,sans-serif;background:#fff;margin:0;padding:24px}*{box-sizing:border-box}</style>`)
    win.document.write(`</head><body>${html}</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  const hasActiveFilters = Boolean(searchTerm || fromDate || toDate)
  const resetFilters = () => { setSearchTerm(''); setFromDate(''); setToDate('') }

  const renderSkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-44 bg-slate-200 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-200 rounded" /></td>
      <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-200 rounded-full" /></td>
      <td className="px-6 py-4 text-right"><div className="h-8 w-40 bg-slate-200 rounded-lg inline-block" /></td>
    </tr>
  )

  const renderSkeletonCard = (key) => (
    <div key={key} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-6 w-20 bg-slate-200 rounded-full" />
      </div>
      <div className="h-3 w-40 bg-slate-200 rounded" />
      <div className="h-3 w-32 bg-slate-200 rounded" />
      <div className="flex gap-2 pt-1">
        <div className="h-9 flex-1 bg-slate-200 rounded-xl" />
        <div className="h-9 flex-1 bg-slate-200 rounded-xl" />
      </div>
    </div>
  )

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 space-y-5 sm:space-y-6">

        {/* ── En-tête ── */}
        <div className="flex flex-col gap-5 sm:flex-row sm:justify-between sm:items-center bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#0052CC] to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
              <History size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">Historique des interventions</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0052CC]/10 text-[#0052CC] text-[11px] font-black rounded-lg uppercase tracking-wider">
                  <User size={11} /> {employeeName || '—'}
                </span>
                {resolvedRole && (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg">{resolvedRole}</span>
                )}
                <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Interventions clôturées et validées</span>
              </div>
            </div>
          </div>

          {/* Stat total */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-4 py-3 flex-1 sm:flex-none">
              <div className="w-10 h-10 rounded-xl bg-white border border-green-200 flex items-center justify-center text-green-600 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-green-600/80 uppercase tracking-wider leading-none">Clôturées</p>
                <p className="text-xl font-black text-slate-900 leading-tight">{filtered.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filtres ── */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1 min-w-0 group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0052CC] transition-colors" />
            <input
              type="text"
              placeholder="Rechercher (réf, fiche, client, machine, site)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] hover:border-slate-300 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 sm:flex-none justify-center hover:border-slate-300 transition-colors">
              <Calendar size={16} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                aria-label="Date de début"
                className="bg-transparent border-none text-sm text-slate-700 font-medium focus:outline-none w-[110px] sm:w-[120px]"
              />
              <span className="text-slate-300 font-bold">→</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                aria-label="Date de fin"
                className="bg-transparent border-none text-sm text-slate-700 font-medium focus:outline-none w-[110px] sm:w-[120px]"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-black hover:bg-red-100 transition-colors active:scale-95"
              >
                <X size={14} /> Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* ── Vue mobile : cartes ── */}
        <div className="space-y-3 lg:hidden">
          {isLoading ? (
            <>{renderSkeletonCard('s1')}{renderSkeletonCard('s2')}{renderSkeletonCard('s3')}</>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center px-6 py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                <AlertCircle size={24} className="text-slate-400" />
              </div>
              <p className="text-sm font-black text-slate-700">Aucune intervention clôturée</p>
              <p className="text-xs text-slate-500 mt-1">{hasActiveFilters ? 'Modifiez vos filtres ou réinitialisez la recherche.' : 'Les interventions validées apparaîtront ici.'}</p>
              {hasActiveFilters && (
                <button type="button" onClick={resetFilters} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black active:scale-95 transition-transform">
                  <X size={14} /> Réinitialiser
                </button>
              )}
            </div>
          ) : (
            filtered.map((row) => (
              <div
                key={row.id}
                ref={row.id === highlightId ? highlightRowRef : null}
                className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all ${
                  row.id === highlightId ? 'border-amber-300 ring-2 ring-amber-200 animate-pulse' : 'border-slate-200'
                }`}
              >
                <div className="h-1 w-full bg-green-500" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        <Hash size={11} /> {row.ficheNumber || row.id}
                      </div>
                      <p className="text-base font-black text-slate-900 leading-tight truncate">{row.clientName || '—'}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black border bg-green-50 text-green-700 border-green-200 shrink-0">
                      <CheckCircle2 size={11} /> Clôturée
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold min-w-0">
                      <Calendar size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{row.interventionDate || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold min-w-0">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{row.siteName || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold min-w-0">
                      <Wrench size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{row.machine || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold min-w-0">
                      <User size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{row.assignedEmployeesDisplay || row.technicianName || '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(row)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-black transition-colors active:scale-95"
                    >
                      <Eye size={14} /> Détails
                    </button>
                    {!modifiedIdsSet.has(row.id) && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/interventions/${row.id}`, {
                            state: {
                              assignedTechnicianName: row.assignedEmployeesDisplay || row.technicianName,
                              missionId: row.missionId,
                              returnTo: `${window.location.pathname}${window.location.search}`,
                            },
                          })
                        }
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-black transition-colors active:scale-95"
                      >
                        <Edit3 size={14} /> Modifier
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Vue desktop : tableau ── */}
        <div className="hidden lg:flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Machine</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <>
                    {renderSkeletonRow()}
                    {renderSkeletonRow()}
                    {renderSkeletonRow()}
                  </>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                          <AlertCircle size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-black text-slate-700">Aucune intervention clôturée</p>
                        <p className="text-xs text-slate-500 mt-1">{hasActiveFilters ? 'Modifiez vos filtres ou effectuez une autre recherche.' : 'Les interventions validées apparaîtront ici.'}</p>
                        {hasActiveFilters && (
                          <button type="button" onClick={resetFilters} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-950 transition-colors">
                            <X size={14} /> Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      ref={row.id === highlightId ? highlightRowRef : null}
                      className={`transition-colors ${
                        row.id === highlightId
                          ? 'bg-amber-50 ring-2 ring-amber-200 animate-pulse'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900">{row.id}</p>
                          <p className="text-xs text-slate-500 font-semibold truncate">{row.ficheNumber || '—'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">{row.interventionDate || '—'}</p>
                        <p className="text-xs text-slate-500 font-semibold">{row.siteName || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">{row.clientName || '—'}</p>
                        <p className="text-xs text-slate-500 font-semibold">{row.assignedEmployeesDisplay || row.technicianName || ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">{row.machine || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${statusBadgeByStatus[row.status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          <CheckCircle2 size={12} /> Clôturée
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(row)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-black transition-colors"
                          >
                            <Eye size={14} /> Détails
                          </button>
                          {!modifiedIdsSet.has(row.id) && (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/interventions/${row.id}`, {
                                  state: {
                                    assignedTechnicianName: row.assignedEmployeesDisplay || row.technicianName,
                                    missionId: row.missionId,
                                    returnTo: `${window.location.pathname}${window.location.search}`,
                                  },
                                })
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-black transition-colors"
                            >
                              <Edit3 size={14} /> Modifier
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showDetails && selected && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overscroll-contain" onClick={handleCloseDetails}>
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[92vh]" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                    <Eye size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aperçu de la fiche officielle</p>
                    <p className="text-sm font-black text-slate-900 truncate">{selected.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-colors"
                  >
                    <Printer size={14} /> Imprimer
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseDetails}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div ref={printRef} className="flex-1 overflow-hidden flex">
                <InterventionPreview intervention={selected} />
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
                >
                  Fermer l'aperçu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
