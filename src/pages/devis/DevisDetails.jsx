import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
import {
  ChevronLeft,
  FileText,
  Calendar,
  User,
  DollarSign,
  RefreshCw,
  Printer,
  Download,
  AlertTriangle,
  Eye,
  Plus,
  Hash,
  Truck,
  Layers,
  Percent,
  Calculator,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Trash2,
  Clock,
  ArrowRight
} from 'lucide-react'
import logo from '../../assets/logo.jpg'
import DevisSuiviSection, { DevisSuiviTimeline, HorizontalStatusTimeline } from '../../components/devis/DevisSuiviSection.jsx'

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount || 0)
}

const formatPrice = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount || 0)
}

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeRate = (value) => Math.max(0, toNumber(value, 0))

const extractTauxFromCode = (codeTva) => {
  if (!codeTva) return 0
  const match = String(codeTva).match(/(\d+(?:\.\d+)?)/)
  if (match) return parseFloat(match[1])
  return 0
}

const resolveTVA = (line) => {
  const taux = normalizeRate(line?.TVA)
  if (taux > 0) return taux
  return extractTauxFromCode(line?.CodeTVA)
}

const getLineNetHT = (line) => {
  const fromApi = toNumber(line?.Total_HT, NaN)
  if (Number.isFinite(fromApi) && fromApi >= 0) return fromApi
  const alt = toNumber(line?.TotalNetHT, NaN)
  if (Number.isFinite(alt) && alt >= 0) return alt
  const qte = Math.max(0, toNumber(line?.Qte))
  const pu = Math.max(0, toNumber(line?.PU_HT))
  const remise = normalizeRate(line?.Remise)
  return qte * pu * (1 - remise / 100)
}

const computeTotals = (lines, footer = [], header = {}) => {
  const articleLines = (Array.isArray(lines) ? lines : []).filter((d) => (d?.Code || d?.Designation) && toNumber(d?.Qte) > 0)

  const totalHTBrut = articleLines.reduce((acc, d) => acc + toNumber(d.Qte) * toNumber(d.PU_HT), 0)
  const totalRemise = articleLines.reduce(
    (acc, d) => acc + toNumber(d.Qte) * toNumber(d.PU_HT) * (normalizeRate(d.Remise) / 100),
    0,
  )
  const totalNetHT = articleLines.reduce((acc, d) => acc + getLineNetHT(d), 0)
  const computedTVA = articleLines.reduce((acc, d) => acc + getLineNetHT(d) * (resolveTVA(d) / 100), 0)

  const footerRows = Array.isArray(footer) ? footer : []
  const footerTVA = footerRows.reduce((acc, f) => acc + toNumber(f?.Montant_TVA), 0)
  const totalTVA = footerRows.length > 0 ? footerTVA : computedTVA

  const timbreCandidates = [
    header?.TIMBRE,
    header?.Timbre,
    header?.DROITTIMBRE,
    header?.DroitTimbre,
    header?.DROIT_TIMBRE,
  ]
  const timbreParsed = timbreCandidates.map((v) => toNumber(v, NaN)).find((v) => Number.isFinite(v) && v >= 0)
  const timbre = Number.isFinite(timbreParsed) ? timbreParsed : 1.0

  const totalTTC = totalNetHT + totalTVA + timbre

  return { totalHTBrut, totalRemise, totalNetHT, totalTVA, timbre, totalTTC }
}

const normalizeDevisPayload = (payload) => {
  const toText = (value, fallback = '') => {
    if (value === null || value === undefined) {
      return fallback
    }

    const text = String(value).trim()
    return text || fallback
  }

  const details = Array.isArray(payload?.details)
    ? payload.details.map((item) => ({
      ...item,
      CodeTVA: toText(item?.CodeTVA, ''),
      Qte: toNumber(item?.Qte),
      PU_HT: toNumber(item?.PU_HT),
      Remise: toNumber(item?.Remise),
      TVA: toNumber(item?.TVA),
      Total_HT: toNumber(item?.Total_HT),
    }))
    : []

  const footer = Array.isArray(payload?.footer)
    ? payload.footer.map((item) => ({
      ...item,
      TVA: toText(item?.TVA, 'SANS_CODE'),
      TVA_Footer: toNumber(item?.TVA_Footer),
      Base_TVA: toNumber(item?.Base_TVA),
      Montant_TVA: toNumber(item?.Montant_TVA),
    }))
    : []

  return {
    ...payload,
    header: {
      ...payload?.header,
      TOTREM: toNumber(payload?.header?.TOTREM),
      TOTTAX: toNumber(payload?.header?.TOTTAX),
      TOTTTCDV: toNumber(payload?.header?.TOTTTCDV),
      TotNetHT: toNumber(payload?.header?.TotNetHT),
    },
    details,
    footer,
  }
}

// --- Fiche Devis (Preview) ---
function DevisFiche({ data }) {
  if (!data || !data.header) return null

  const { header, details, footer } = data
  const totals = computeTotals(details, footer, header)

  return (
    <div className="bg-white shadow-2xl px-7 pt-5 pb-8 relative overflow-hidden border border-slate-300 text-slate-900 leading-tight" 
         style={{ fontFamily: 'Arial, Helvetica, sans-serif', minHeight: '842px', width: '595px', margin: '0 auto' }}>
      
      {/* Header Info */}
      <div className="flex justify-between items-start mb-4">
        <div className="w-1/2">
          <div className="font-black text-lg tracking-tight mb-1">SOMACS</div>
          <div className="text-[9px] leading-relaxed">
            2/2 Rue ELFOULEDH Z.I. MEGRINE RIADH<br />
            Code postal : 2014 Ville : BEN AROUS<br />
            Tel : 71 425 609 Fax : 71428777<br />
            Code TVA : 491027RAM000<br />
            RC : B1118371998<br />
            RIB : 32008788101030758151
          </div>
        </div>
        <div className="w-1/2 border border-slate-900 p-2 text-[9px]">
          <div className="flex justify-between font-bold mb-1">
            <span>BTS POUR LE COMPTE DE</span>
            <span>BTS</span>
          </div>
          <div className="font-bold mb-2">{header.NOMTIE}</div>
          <div>EQ</div>
          <div className="flex justify-between mt-2">
            <span>Tel : {header.TEL || ''}</span>
            <span>Fax : {header.FAX || ''}</span>
          </div>
          <div>Code TVA: {header.CODTVA || '000'}</div>
        </div>
      </div>

      {/* Devis Title */}
      <div className="border border-slate-900 bg-slate-50/50 py-1 px-4 text-center mb-4">
        <div className="font-black text-sm uppercase tracking-widest">
          DEVIS EQ N°: {header.NUMERO}
        </div>
        <div className="flex justify-between text-[9px] mt-1 font-bold">
          <span>Echéance {formatDate(header.DATLIV)}</span>
          <span>Du {formatDate(header.DATDOC)}</span>
          <span>Edité le: {new Date().toLocaleDateString('fr-FR')} à: {new Date().toLocaleTimeString('fr-FR')}</span>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse border border-slate-900 mb-4 text-[9px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-900 italic font-bold">
            <th className="border-r border-slate-900 p-1 w-[15%]">Code</th>
            <th className="border-r border-slate-900 p-1 text-center w-[40%]">Désignation</th>
            <th className="border-r border-slate-900 p-1 text-center w-[8%]">Qte</th>
            <th className="border-r border-slate-900 p-1 text-center w-[12%]">P.U HT</th>
            <th className="border-r border-slate-900 p-1 text-center w-[7%]">Rem</th>
            <th className="border-r border-slate-900 p-1 text-center w-[7%]">TVA</th>
            <th className="p-1 text-center w-[11%]">Tot Net HT</th>
          </tr>
        </thead>
        <tbody>
          {details.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-900/10">
              <td className="border-r border-slate-900 p-1 font-mono">{item.Code}</td>
              <td className="border-r border-slate-900 p-1">{item.Designation}</td>
              <td className="border-r border-slate-900 p-1 text-center">{item.Qte}</td>
              <td className="border-r border-slate-900 p-1 text-right">{formatPrice(item.PU_HT)}</td>
              <td className="border-r border-slate-900 p-1 text-center">{item.Remise > 0 ? formatPrice(item.Remise) : ''}</td>
              <td className="border-r border-slate-900 p-1 text-center">{formatPrice(item.TVA)}</td>
              <td className="p-1 text-right">{formatPrice(item.Total_HT)}</td>
            </tr>
          ))}
          {/* Fill empty rows to maintain layout if needed */}
          {Array.from({ length: Math.max(0, 10 - details.length) }).map((_, i) => (
            <tr key={`empty-${i}`} className="h-4 border-b border-slate-900/10">
              <td className="border-r border-slate-900"></td>
              <td className="border-r border-slate-900"></td>
              <td className="border-r border-slate-900"></td>
              <td className="border-r border-slate-900"></td>
              <td className="border-r border-slate-900"></td>
              <td className="border-r border-slate-900"></td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Totals & TVA */}
      <div className="flex gap-4 mb-4">
        {/* TVA Summary Table */}
        <div className="w-[45%]">
          <table className="w-full border-collapse border border-slate-900 text-[9px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-900 font-bold italic">
                <th className="border-r border-slate-900 p-1 text-left">Taux TVA</th>
                <th className="border-r border-slate-900 p-1 text-center">Base TVA</th>
                <th className="p-1 text-center">Montant TVA</th>
              </tr>
            </thead>
            <tbody>
              {footer.map((f, idx) => (
                <tr key={idx} className="border-b border-slate-900/10">
                  <td className="border-r border-slate-900 p-1 font-bold">TVA {f.TVA_Footer}%</td>
                  <td className="border-r border-slate-900 p-1 text-right">{formatPrice(f.Base_TVA)}</td>
                  <td className="p-1 text-right">{formatPrice(f.Montant_TVA)}</td>
                </tr>
              ))}
              <tr className="font-bold border-t border-slate-900">
                <td className="border-r border-slate-900 p-1">Total</td>
                <td className="border-r border-slate-900 p-1"></td>
                <td className="p-1 text-right">{formatPrice(footer.reduce((acc, f) => acc + f.Montant_TVA, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="w-[55%] ml-auto">
          <div className="flex flex-col gap-1 text-[10px]">
            <div className="flex justify-between px-2">
              <span className="font-bold">Total HT Brut :</span>
              <span className="font-black">{formatPrice(totals.totalHTBrut)}</span>
            </div>
            <div className="flex justify-between px-2">
              <span className="font-bold">Total Remise :</span>
              <span className="font-black">{formatPrice(totals.totalRemise)}</span>
            </div>
            <div className="flex justify-between px-2">
              <span className="font-bold">Total Net HT :</span>
              <span className="font-black">{formatPrice(totals.totalNetHT)}</span>
            </div>
            <div className="flex justify-between px-2">
              <span className="font-bold">Total TVA :</span>
              <span className="font-black">{formatPrice(totals.totalTVA)}</span>
            </div>
            <div className="flex justify-between px-2">
              <span className="font-bold">Droit Timbre :</span>
              <span className="font-black">{formatPrice(totals.timbre)}</span>
            </div>
            <div className="flex justify-between bg-slate-50 border border-slate-900 p-1 px-2 mt-1">
              <span className="font-black uppercase">TOTAL TTC</span>
              <span className="font-black">{formatPrice(totals.totalTTC)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="text-[9px] mb-4 border-t border-slate-900 pt-2">
        <div className="italic mb-1">Arrêté le(a) présent(e) DEVIS EQ à la somme de :</div>
        <div className="font-black uppercase">
          {header.AMOUNT_WORDS || header.amountWords || 'Montant en lettres non disponible'}
        </div>
      </div>

      {/* Conditions & Signatures */}
      <div className="grid grid-cols-2 gap-8 text-[9px] mt-4">
        <div className="space-y-1">
          <div><span className="font-bold">Validé de l'offre :</span></div>
          <div><span className="font-bold">Mode de paiement :</span></div>
          <div><span className="font-bold">Délai de Livraison :</span></div>
        </div>
        <div className="text-center">
          <div className="font-bold mb-8 italic">Cachet et signature</div>
          <div className="flex justify-center opacity-20 grayscale">
            {/* Minimal signature placeholder */}
            <div className="border-2 border-slate-900 rounded-full w-24 h-12 flex items-center justify-center">
              SOMACS
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="absolute bottom-4 left-7 right-7 border-t border-slate-300 pt-1 flex justify-between items-center text-[7px] font-bold text-slate-400">
        <div>SOMACS SERVICE S.A.R.L - 2/2 Rue ELFOULEDH Z.I. MEGRINE RIADH</div>
        <div>MF: 1420197A/A/M/000</div>
      </div>
    </div>
  )
}

// --- Main Page Component ---
export default function DevisDetails() {
  const params = useParams()
  const numero = params['*']
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('informations')
  const [sharedStatuses, setSharedStatuses] = useState(null) // null = not yet loaded

  const abortRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      try { abortRef.current?.abort() } catch {}
    }
  }, [])

  const fetchDevisDetails = useCallback(async () => {
    if (!numero) return
    // Annule un précédent fetch en vol pour éviter les races (Strict Mode, double-clic…)
    try { abortRef.current?.abort() } catch {}
    const controller = new AbortController()
    abortRef.current = controller

    if (isMountedRef.current) { setLoading(true); setError(null) }

    try {
      const response = await apiFetch(`/devis/${encodeURIComponent(numero)}`, {
        auth: true,
        signal: controller.signal,
        timeoutMs: 25_000,
      })
      if (!isMountedRef.current || controller.signal.aborted) return

      if (response.ok) {
        const result = await response.json()
        if (!isMountedRef.current) return
        const normalized = normalizeDevisPayload(result)
        setData(normalized)

        // Initialiser sharedStatuses depuis localStorage
        const numero_ = normalized?.header?.NUMERO || ''
        const typDoc_ = normalized?.header?.TYPDOC || ''
        if (numero_ && typDoc_) {
          try {
            const key = `devis_statuses_${numero_}_${typDoc_}`
            const raw = localStorage.getItem(key)
            if (raw) {
              const parsed = JSON.parse(raw)
              if (Array.isArray(parsed) && parsed.length > 0) setSharedStatuses(parsed)
            }
          } catch {}
        }
      } else if (response.status === 401) {
        if (!isMountedRef.current) return
        setError('Session expirée. Veuillez vous reconnecter.')
      } else if (response.status === 408) {
        if (!isMountedRef.current) return
        setError('Le serveur de base de données est trop lent. Réessayez dans un instant.')
      } else {
        const errorPayload = await response.json().catch(() => null)
        if (!isMountedRef.current) return
        const serverMessage =
          typeof errorPayload?.message === 'string'
            ? errorPayload.message
            : 'Le devis demandé est introuvable ou inaccessible.'
        setError(serverMessage)
      }
    } catch (err) {
      if (err?.name === 'AbortError' || err?.name === 'TimeoutError') return
      if (!isMountedRef.current) return
      console.error('Error fetching devis details:', err)
      const msg = /timeout/i.test(err?.message || '')
        ? 'Le serveur met trop de temps à répondre.'
        : (err?.message || 'Impossible de joindre le serveur. Vérifiez votre connexion.')
      setError(msg)
    } finally {
      // GARANTIT que le loader ne reste JAMAIS bloqué
      if (isMountedRef.current && !controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [numero])

  useEffect(() => {
    fetchDevisDetails()
  }, [fetchDevisDetails])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Chargement du devis {numero}...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/devis')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-bold transition-colors">
            <ChevronLeft size={20} /> Retour à la liste
          </button>
          <div className="bg-white p-12 rounded-3xl border border-red-100 shadow-xl shadow-red-500/5 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Une erreur est survenue</h2>
            <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">{error || "Nous n'avons pas pu charger les détails de ce devis."}</p>
            <button onClick={fetchDevisDetails} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black transition-transform active:scale-95 shadow-lg shadow-slate-200">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { header, details, footer } = data
  const totals = computeTotals(details, footer, header)

  return (
    <div className="p-4 sm:p-6 bg-[#f8fafc] min-h-screen">
      {/* Top Navigation & Actions */}
      <div className="max-w-[1600px] mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/devis')}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                Détails Devis {header.NUMERO}
              </h1>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full border border-blue-100 uppercase tracking-wider">
                {header.TYPDOC}
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
              Consultez les informations détaillées du devis et l'aperçu du document
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm">
            <Printer size={18} />
            <span className="hidden sm:inline">Imprimer</span>
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] text-white rounded-xl font-bold hover:bg-[#0747A6] transition-all shadow-lg shadow-blue-200">
            <Download size={18} />
            <span className="hidden sm:inline">Télécharger PDF</span>
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Information Cards */}
        <div className="xl:col-span-7 space-y-6">

          {/* Tab Buttons */}
          <div className="flex gap-2 bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm w-fit">
            {[
              { key: 'informations', label: 'Informations' },
              { key: 'suivi', label: 'Suivi commercial' },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#0052CC] text-white shadow-md shadow-blue-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'informations' && (<>
          
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Building2 size={20} />
              </div>
              <h2 className="font-black text-slate-900 uppercase tracking-wider text-sm">Informations Générales</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</label>
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <User size={16} className="text-blue-500" />
                  {header.NOMTIE}
                </div>
                {header.CODTIE && <div className="text-xs text-slate-500">Code: {header.CODTIE}</div>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Numéro Devis</label>
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Hash size={16} className="text-blue-500" />
                  {header.NUMERO}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Document</label>
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" />
                  {formatDate(header.DATDOC)}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Livraison Prévue</label>
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Truck size={16} className="text-blue-500" />
                  {formatDate(header.DATLIV)}
                </div>
              </div>
              {(header.NomRep || header.CODREP) && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commercial</label>
                  <div className="font-bold text-slate-900">{header.NomRep || header.CODREP}</div>
                </div>
              )}
              {header.TEL && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</label>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Phone size={16} className="text-blue-500" />
                    {header.TEL}
                  </div>
                </div>
              )}
              {(header.ADRCLI || header.VILLE) && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adresse</label>
                  <div className="text-sm text-slate-700">
                    {[header.ADRCLI, header.CODPOS, header.VILLE, header.Region].filter(Boolean).join(', ')}
                  </div>
                </div>
              )}
              {header.LIBPAI && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode de paiement</label>
                  <div className="text-sm font-bold text-slate-700">{header.LIBPAI}</div>
                </div>
              )}
              {header.OBSERVATION && (
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observation</label>
                  <div className="text-sm text-slate-600">{header.OBSERVATION}</div>
                </div>
              )}
            </div>
          </div>

          {/* Details Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Layers size={20} />
              </div>
              <h2 className="font-black text-slate-900 uppercase tracking-wider text-sm">Détails des Produits</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Désignation</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qté</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">P.U HT</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Remise (%)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">TVA (%)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {details.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 text-sm">{item.Code}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.Designation}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-black rounded-lg">
                          {item.Qte}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">
                        {formatCurrency(item.PU_HT)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-bold ${item.Remise > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {item.Remise > 0 ? `${item.Remise}%` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-slate-600">
                          {item.TVA}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-blue-600 text-sm">
                        {formatCurrency(item.Total_HT)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Totals Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TVA Summary */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <Percent size={20} />
                </div>
                <h2 className="font-black text-slate-900 uppercase tracking-wider text-sm">Récapitulatif TVA</h2>
              </div>
              <div className="p-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="py-2">Taux</th>
                      <th className="py-2 text-right">Base</th>
                      <th className="py-2 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {footer.map((f, idx) => (
                      <tr key={idx}>
                        <td className="py-3 text-sm font-bold text-slate-900">TVA {f.TVA_Footer}%</td>
                        <td className="py-3 text-right text-sm font-medium text-slate-600">{formatCurrency(f.Base_TVA)}</td>
                        <td className="py-3 text-right text-sm font-bold text-slate-900">{formatCurrency(f.Montant_TVA)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Final Totals */}
            <div className="bg-[#0052CC] rounded-3xl border border-[#0052CC] shadow-xl shadow-blue-200 overflow-hidden text-white">
              <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
                <div className="p-2 bg-white/20 rounded-lg text-white">
                  <Calculator size={20} />
                </div>
                <h2 className="font-black uppercase tracking-wider text-sm">Totaux du Devis</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-white/70 font-bold uppercase text-[10px] tracking-widest">Total HT brut</span>
                  <span className="text-lg font-black">{formatCurrency(totals.totalHTBrut)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-white/70 font-bold uppercase text-[10px] tracking-widest">Total remise</span>
                  <span className="text-lg font-black">{formatCurrency(totals.totalRemise)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-white/70 font-bold uppercase text-[10px] tracking-widest">Total net HT</span>
                  <span className="text-lg font-black">{formatCurrency(totals.totalNetHT)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-white/70 font-bold uppercase text-[10px] tracking-widest">Total TVA</span>
                  <span className="text-lg font-black">{formatCurrency(totals.totalTVA)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-white/70 font-bold uppercase text-[10px] tracking-widest">Droit de timbre</span>
                  <span className="text-lg font-black">{formatCurrency(totals.timbre)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-white font-black uppercase text-xs tracking-[0.2em]">Total TTC</span>
                  <div className="text-right">
                    <span className="text-3xl font-black block">{formatCurrency(totals.totalTTC)}</span>
                    <span className="text-[10px] font-bold text-white/60">Dinars Tunisiens</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </>)}

          {activeTab === 'suivi' && (
            <DevisSuiviSection
              devis={{
                numeroDevis: header.NUMERO,
                typDoc: header.TYPDOC,
                clientCode: header.CODTIE || '',
                commercialCode: header.CODREP || header.NomRep || header.UserCreate || '',
                clientLabel: header.NOMTIE || '',
                commercialLabel: header.NomRep || header.CODREP || '',
                montantDevis: totals.totalTTC,
                createdAt: header.DATDOC,
                updatedAt: header.DateMaj || header.DateCreate || header.DATDOC,
              }}
              enableTimeline={false}
              onStatusesChange={setSharedStatuses}
            />
          )}
        </div>

        {/* Right Column: Fiche Preview */}
        <div className="xl:col-span-5">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between mb-2 px-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">Aperçu Document Officiel</h3>
              </div>
              <div className="text-[10px] font-bold text-slate-400">Format A4 Standard</div>
            </div>
            
            {/* The actual preview container with scaling */}
            <div className="bg-slate-200 rounded-[32px] p-4 sm:p-8 shadow-inner overflow-hidden flex justify-center border-4 border-white">
              <div className="origin-top transform scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.9] xl:scale-[0.75] 2xl:scale-[0.85] transition-transform duration-500">
                <DevisFiche data={data} />
              </div>
            </div>
            
            {/* Action Hint */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Eye size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Vérification de mise en page</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Cet aperçu reflète exactement le document qui sera imprimé ou envoyé au client.</p>
              </div>
            </div>

          </div>
        </div>

      </div>

      <div className="mt-6 max-w-[1600px] mx-auto">
        <DevisSuiviTimeline
          devis={{
            numeroDevis: header.NUMERO,
            typDoc: header.TYPDOC,
            clientCode: header.CODTIE || '',
            commercialCode: header.CODREP || header.NomRep || header.UserCreate || '',
            clientLabel: header.NOMTIE || '',
            commercialLabel: header.NomRep || header.CODREP || '',
            montantDevis: totals.totalTTC,
            createdAt: header.DATDOC,
            updatedAt: header.DateMaj || header.DateCreate || header.DATDOC,
          }}
          selectedStatuses={sharedStatuses ?? undefined}
        />
      </div>
    </div>
  )
}
