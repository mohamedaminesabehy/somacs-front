import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  User,
  Calendar,
  Building2,
  Percent,
  Calculator,
  AlertCircle,
  Package,
  CheckCircle2,
  RefreshCw,
  Truck
} from 'lucide-react'
import ArticleSelectionModal from '../../components/devis/ArticleSelectionModal'

// --- Helper Functions ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
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

const createEmptyLine = () => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  Code: '',
  Designation: '',
  CodeTVA: '',
  AnneeTaxe: null,
  Qte: 0,
  PU_HT: 0,
  Remise: 0,
  TVA: 0,
  Total_HT: 0,
  Total_TTC: 0
})

const CreateDevis = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Header State
  const [header, setHeader] = useState({
    NUMERO: '', // Sera généré par le backend ou auto
    TYPDOC: 'DE',
    DATDOC: new Date().toISOString().split('T')[0],
    DATLIV: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    NOMTIE: '',
    CODTIE: '',
    ADRCLI: '',
    VILLE: '',
    CODPOS: '',
    TELCLI: '',
    CODTVA: '',
    OBSERVATION: ''
  })

  // Details State
  const [details, setDetails] = useState([createEmptyLine()])

  // Articles Modal
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false)
  const [articleRowIndex, setArticleRowIndex] = useState(null)

  // Footer / Totals State
  const [totals, setTotals] = useState({
    totalNetHT: 0,
    totalRemise: 0,
    totalTVA: 0,
    totalTTC: 0,
    tvaSummary: [] // Array of { code: 'TVA19', base: 0, amount: 0 }
  })

  // Recalculate totals whenever details change
  useEffect(() => {
    const newTotals = details.reduce((acc, item) => {
      const qte = Math.max(0, toNumber(item.Qte, 0))
      const pu = Math.max(0, toNumber(item.PU_HT, 0))
      const remise = normalizeRate(item.Remise)
      const tva = normalizeRate(item.TVA)

      const lineBrut = qte * pu
      const lineRemise = lineBrut * (remise / 100)
      const lineHT = lineBrut - lineRemise
      const lineTVA = lineHT * (tva / 100)
      
      acc.totalNetHT += lineHT
      acc.totalRemise += lineRemise
      acc.totalTVA += lineTVA
      
      // TVA Summary logic grouped by Code TVA
      const codeTVA = item.CodeTVA || 'SANS_CODE'
      const existingTVA = acc.tvaSummary.find(t => t.code === codeTVA)
      if (existingTVA) {
        existingTVA.base += lineHT
        existingTVA.amount += lineTVA
      } else if (qte > 0) {
        acc.tvaSummary.push({ code: codeTVA, base: lineHT, amount: lineTVA })
      }
      
      return acc
    }, { totalNetHT: 0, totalRemise: 0, totalTVA: 0, totalTTC: 0, tvaSummary: [] })

    newTotals.totalTTC = newTotals.totalNetHT + newTotals.totalTVA + 1.000 // + 1.000 Timbre
    setTotals(newTotals)
  }, [details])

  const handleHeaderChange = (e) => {
    const { name, value } = e.target
    setHeader(prev => ({ ...prev, [name]: value }))
  }

  const handleLineChange = (index, field, value) => {
    const newDetails = [...details]
    const item = { ...newDetails[index] }

    if (field === 'Qte' || field === 'PU_HT') {
      item[field] = Math.max(0, toNumber(value, 0))
    } else if (field === 'Remise' || field === 'TVA') {
      item[field] = normalizeRate(value)
    } else {
      item[field] = value
    }
    
    // Recalculate line total
    const qte = Math.max(0, toNumber(item.Qte, 0))
    const pu = Math.max(0, toNumber(item.PU_HT, 0))
    const rem = normalizeRate(item.Remise)
    const tva = normalizeRate(item.TVA)
    
    item.Total_HT = qte * pu * (1 - rem / 100)
    item.Total_TTC = item.Total_HT * (1 + tva / 100)
    
    newDetails[index] = item
    setDetails(newDetails)
  }

  const addLine = () => {
    setDetails((prev) => [...prev, createEmptyLine()])
  }

  const removeLine = (index) => {
    if (details.length > 1) {
      const newDetails = details.filter((_, i) => i !== index)
      setDetails(newDetails)
    }
  }

  const openArticleModal = (index) => {
    setArticleRowIndex(index)
    setIsArticleModalOpen(true)
  }

  const selectArticle = (article) => {
    const pu = Math.max(0, toNumber(article.PV, 0))
    const tva = normalizeRate(article.tva ?? article.TVA ?? article.tauxmaj)
    const remiseArticle = normalizeRate(article.remise ?? article.REM ?? article.Remise)
    const codeTva = article.codeTva ?? article.CodeTVA ?? article.CODTAXE ?? ''
    const anneeTaxe = article.anneeTaxe ?? article.AnneeTaxe ?? null

    console.debug('[CreateDevis] article selected', {
      CODE: article.CODE,
      CodeTVA: codeTva,
      AnneeTaxe: anneeTaxe,
      tauxmaj: tva,
      remise: remiseArticle,
      PV: pu,
    })

    setDetails((prev) => {
      const safeIndex =
        articleRowIndex !== null && articleRowIndex >= 0 && articleRowIndex < prev.length
          ? articleRowIndex
          : prev.findIndex((line) => !line.Code)

      const targetIndex = safeIndex >= 0 ? safeIndex : prev.length
      const workingRows = safeIndex >= 0 ? [...prev] : [...prev, createEmptyLine()]
      const currentLine = workingRows[targetIndex]

      const qte = 1
      const remise = remiseArticle
      const totalHt = qte * pu * (1 - remise / 100)

      workingRows[targetIndex] = {
        ...currentLine,
        Code: article.CODE,
        Designation: article.LIBELL,
        CodeTVA: codeTva,
        AnneeTaxe: anneeTaxe,
        Qte: qte,
        PU_HT: pu,
        Remise: remise,
        TVA: tva,
        Total_HT: totalHt,
        Total_TTC: totalHt * (1 + tva / 100)
      }

      const hasEmptyLine = workingRows.some((line) => !line.Code)
      if (!hasEmptyLine) {
        workingRows.push(createEmptyLine())
      }

      return workingRows
    })

    setArticleRowIndex(null)
    setIsArticleModalOpen(false)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('auth_token')
      
      const payload = {
        ...header,
        details: details
          .filter(d => d.Code && toNumber(d.Qte, 0) > 0)
          .map((d) => ({
            ...d,
            Qte: Math.max(0, toNumber(d.Qte, 0)),
            PU_HT: Math.max(0, toNumber(d.PU_HT, 0)),
            Remise: normalizeRate(d.Remise),
            TVA: normalizeRate(d.TVA),
          })),
        totals: {
          totalNetHT: totals.totalNetHT,
          totalRemise: totals.totalRemise,
          totalTVA: totals.totalTVA,
          totalTTC: totals.totalTTC
        }
      }

      const response = await fetch('http://localhost:3000/devis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => navigate('/devis'), 2000)
      } else {
        const data = await response.json()
        setError(data.message || 'Erreur lors de la création du devis')
      }
    } catch (err) {
      console.error('Error creating devis:', err)
      setError('Impossible de joindre le serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="p-4 sm:p-6 bg-[#f8fafc] min-h-screen">
      {/* Header Actions */}
      <div className="max-w-[1600px] mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/devis')}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              Nouveau Devis
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Créez un nouveau devis avec calculs dynamiques</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0052CC] text-white rounded-xl font-bold hover:bg-[#0747A6] transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            Enregistrer le Devis
          </button>
        </div>
      </div>

      {success && (
        <div className="max-w-[1600px] mx-auto mb-6 bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center gap-3 text-green-700 animate-in fade-in zoom-in">
          <CheckCircle2 size={24} />
          <p className="font-bold">Devis créé avec succès ! Redirection...</p>
        </div>
      )}

      {error && (
        <div className="max-w-[1600px] mx-auto mb-6 bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-700 animate-in fade-in zoom-in">
          <AlertCircle size={24} />
          <p className="font-bold">{error}</p>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Section: Header & Items */}
        <div className="xl:col-span-8 space-y-6">
          {/* Client & General Info */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Building2 size={20} />
              </div>
              <h2 className="font-black text-slate-900 uppercase tracking-wider text-sm">Informations Client</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} className="text-blue-500" /> Client (Nom)
                </label>
                <input
                  type="text"
                  name="NOMTIE"
                  value={header.NOMTIE}
                  onChange={handleHeaderChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-sm"
                  placeholder="Nom du client..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} className="text-blue-500" /> Date Document
                </label>
                <input
                  type="date"
                  name="DATDOC"
                  value={header.DATDOC}
                  onChange={handleHeaderChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Truck size={12} className="text-blue-500" /> Livraison Prévue
                </label>
                <input
                  type="date"
                  name="DATLIV"
                  value={header.DATLIV}
                  onChange={handleHeaderChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-sm"
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Package size={20} />
                </div>
                <h2 className="font-black text-slate-900 uppercase tracking-wider text-sm">Articles du Devis</h2>
              </div>
              <button 
                onClick={addLine}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all"
              >
                <Plus size={16} /> Ajouter une ligne
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[18%]">Article</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[28%]">Désignation</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[8%]">Qté</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[12%]">P.U HT</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[8%]">Rem (%)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[8%]">TVA</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[13%]">Total HT</th>
                    <th className="px-6 py-4 w-[5%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {details.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors relative">
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="text-xs font-black text-blue-700 uppercase tracking-widest min-h-[16px]">
                            {item.Code || 'Aucun article'}
                          </div>
                          <button
                            onClick={() => openArticleModal(idx)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition-all"
                          >
                            Sélectionner article
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={item.Designation}
                          onChange={(e) => handleLineChange(idx, 'Designation', e.target.value)}
                          className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-600"
                        />
                        <div className="mt-1 text-[10px] font-semibold text-slate-400">
                          Année taxe: {item.AnneeTaxe ?? '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={item.Qte}
                          onChange={(e) => handleLineChange(idx, 'Qte', e.target.value)}
                          className="w-16 px-2 py-1 bg-slate-100 rounded-lg text-center font-black text-xs text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <input
                          type="number"
                          value={item.PU_HT}
                          readOnly
                          title="Le prix unitaire HT est récupéré depuis la fiche article"
                          className="w-24 px-2 py-1 bg-transparent border-none text-right font-bold text-sm text-slate-900 focus:ring-0 cursor-not-allowed"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={item.Remise}
                          onChange={(e) => handleLineChange(idx, 'Remise', e.target.value)}
                          className="w-12 px-2 py-1 bg-slate-100 rounded-lg text-center font-bold text-xs text-amber-600 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="text"
                          value={item.CodeTVA || ''}
                          readOnly
                          title="Le code TVA est récupéré depuis la fiche article"
                          className="w-12 px-2 py-1 bg-slate-100 rounded-lg text-center font-bold text-xs text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-not-allowed"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-blue-600 text-sm">
                          {formatCurrency(item.Total_HT)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => removeLine(idx)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Section: Totals & Summary */}
        <div className="xl:col-span-4 space-y-6">
          {/* TVA Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <Percent size={20} />
              </div>
              <h2 className="font-black text-slate-900 uppercase tracking-wider text-sm">Récapitulatif TVA</h2>
            </div>
            <div className="p-6">
              {totals.tvaSummary.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="py-2">TVA</th>
                      <th className="py-2 text-right">Base HT</th>
                      <th className="py-2 text-right">Montant TVA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {totals.tvaSummary.map((tva, idx) => (
                      <tr key={idx}>
                        <td className="py-3 text-sm font-bold text-slate-900">{tva.code}</td>
                        <td className="py-3 text-right text-sm font-medium text-slate-600">{formatCurrency(tva.base)}</td>
                        <td className="py-3 text-right text-sm font-bold text-slate-900">{formatCurrency(tva.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs font-medium italic">
                  Aucun article ajouté pour le moment
                </div>
              )}
            </div>
          </div>

          {/* Final Totals Card */}
          <div className="bg-[#0052CC] rounded-[32px] border border-[#0052CC] shadow-2xl shadow-blue-500/20 overflow-hidden text-white">
            <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3 bg-white/5">
              <div className="p-2 bg-white/20 rounded-xl text-white">
                <Calculator size={22} />
              </div>
              <h2 className="font-black uppercase tracking-wider text-sm">Calculateur Devis</h2>
            </div>
            <div className="p-8 space-y-5">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-white/60 font-black uppercase text-[10px] tracking-[0.2em]">Total Net HT</span>
                <span className="text-xl font-black">{formatCurrency(totals.totalNetHT)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-white/60 font-black uppercase text-[10px] tracking-[0.2em]">Total Remise</span>
                <span className="text-xl font-black">{formatCurrency(totals.totalRemise)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-white/60 font-black uppercase text-[10px] tracking-[0.2em]">Total TVA</span>
                <span className="text-xl font-black">{formatCurrency(totals.totalTVA)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-white/60 font-black uppercase text-[10px] tracking-[0.2em]">Droit de Timbre</span>
                <span className="text-xl font-black">1.000</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <div>
                  <span className="text-white font-black uppercase text-xs tracking-[0.3em] block mb-1">TOTAL TTC</span>
                  <span className="text-[10px] font-bold text-white/50 italic">Dinars Tunisiens</span>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black block tracking-tighter">{formatCurrency(totals.totalTTC)}</span>
                </div>
              </div>
              
              <button 
                onClick={handleSubmit}
                disabled={loading || totals.totalTTC <= 1.0}
                className="w-full mt-4 py-4 bg-white text-[#0052CC] rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-xl disabled:opacity-50"
              >
                {loading ? 'Traitement en cours...' : 'Confirmer et Enregistrer'}
              </button>
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <RefreshCw size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Recalcul en temps réel</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                Toutes les modifications sur les quantités, prix ou remises mettent à jour instantanément les totaux et la TVA.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>

      <ArticleSelectionModal
        isOpen={isArticleModalOpen}
        onClose={() => {
          setIsArticleModalOpen(false)
          setArticleRowIndex(null)
        }}
        onSelect={selectArticle}
      />
    </>
  )
}

export default CreateDevis
