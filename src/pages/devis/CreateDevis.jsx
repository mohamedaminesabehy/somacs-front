import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/apiClient'
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
  Truck,
  Phone
} from 'lucide-react'
import ArticleSelectionModal from '../../components/devis/ArticleSelectionModal'
import ArticleRecommendations from '../../components/devis/ArticleRecommendations'
import { extractTauxFromCode, normalizeRate, resolveTVA, toNumber } from '../../utils/devis'
import { formatPrice as formatCurrency } from '../../utils/format'

// --- Helpers ---
const createLineId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return String(Date.now())
}

// Récupère l'utilisateur connecté (commercial) depuis le localStorage
const getAuthUser = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('auth_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const createEmptyLine = () => ({
  id: createLineId(),
  Code: '',
  Designation: '',
  CodeTVA: '',
  AnneeTaxe: null,
  Qte: 1,
  PU_HT: 0,
  Remise: 0,
  TVA: 0,
  TotalNetHT: 0,
})

// Calcule les totaux depuis les lignes (même logique que DevisDetails)
const computeTotals = (lines) => {
  const articleLines = lines.filter((d) => d.Code && toNumber(d.Qte) > 0)

  const totalHTBrut = articleLines.reduce((acc, d) => acc + toNumber(d.Qte) * toNumber(d.PU_HT), 0)
  const totalRemise = articleLines.reduce(
    (acc, d) => acc + toNumber(d.Qte) * toNumber(d.PU_HT) * (normalizeRate(d.Remise) / 100),
    0
  )
  const totalNetHT = articleLines.reduce((acc, d) => acc + toNumber(d.TotalNetHT), 0)
  const totalTVA = articleLines.reduce(
    (acc, d) => acc + toNumber(d.TotalNetHT) * (resolveTVA(d) / 100),
    0
  )
  const timbre = 1.0
  const totalTTC = totalNetHT + totalTVA + timbre

  // Groupement TVA par taux numérique résolu
  const tvaMap = {}
  for (const d of articleLines) {
    const taux = resolveTVA(d)
    const key = String(taux)
    const base = toNumber(d.TotalNetHT)
    const montant = base * (taux / 100)
    if (!tvaMap[key]) tvaMap[key] = { taux, base: 0, montant: 0 }
    tvaMap[key].base += base
    tvaMap[key].montant += montant
  }
  const tvaSummary = Object.values(tvaMap).sort((a, b) => a.taux - b.taux)

  return { totalHTBrut, totalRemise, totalNetHT, totalTVA, timbre, totalTTC, tvaSummary }
}

const computeLine = (item) => {
  const qte = Math.max(0, toNumber(item.Qte))
  const pu = Math.max(0, toNumber(item.PU_HT))
  const remise = normalizeRate(item.Remise)
  return qte * pu * (1 - remise / 100)
}

const CreateDevis = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [createdNumero, setCreatedNumero] = useState(null)

  // Commercial = utilisateur connecté (lecture seule)
  const authUser = getAuthUser()
  const commercialName = authUser?.name || authUser?.username || ''

  const [header, setHeader] = useState({
    DATDOC: new Date().toISOString().split('T')[0],
    DATLIV: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    NOMTIE: '',
    CODTIE: '',
    ADRCLI: '',
    VILLE: '',
    CODPOS: '',
    TELCLI: '',
    CODTVA: '',
    OBSERVATION: '',
    Region: '',
    CODREP: '',
    NomRep: commercialName,
    CODPAI: '',
    LIBPAI: '',
  })

  const [details, setDetails] = useState([createEmptyLine()])
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false)
  const [articleRowIndex, setArticleRowIndex] = useState(null)

  const totals = computeTotals(details)
  const activeLines = details.filter((line) => line.Code && toNumber(line.Qte) > 0)
  const openLines = details.filter((line) => !line.Code).length

  const handleHeaderChange = (e) => {
    const { name, value } = e.target
    setHeader((prev) => ({ ...prev, [name]: value }))
  }

  const handleLineChange = (index, field, value) => {
    setDetails((prev) => {
      const next = [...prev]
      const item = { ...next[index], [field]: value }
      item.TotalNetHT = computeLine(item)
      next[index] = item
      return next
    })
  }

  const addLine = () => setDetails((prev) => [...prev, createEmptyLine()])

  const removeLine = (index) => {
    if (details.length > 1) setDetails((prev) => prev.filter((_, i) => i !== index))
  }

  const openArticleModal = (index) => {
    setArticleRowIndex(index)
    setIsArticleModalOpen(true)
  }

  const selectArticle = (article) => {
    const pu = Math.max(0, toNumber(article.PV, 0))
    const codeTva = article.codeTva ?? article.CodeTVA ?? article.CODTAXE ?? ''
    const anneeTaxe = article.anneeTaxe ?? article.AnneeTaxe ?? null
    // Résoudre le taux TVA : depuis le champ numérique ou depuis le code
    const tvaFromField = normalizeRate(article.tva ?? article.TVA ?? article.tauxmaj)
    const tva = tvaFromField > 0 ? tvaFromField : extractTauxFromCode(codeTva)
    const remise = normalizeRate(article.remise ?? article.REM ?? article.Remise)

    setDetails((prev) => {
      const safeIndex =
        articleRowIndex !== null && articleRowIndex >= 0 && articleRowIndex < prev.length
          ? articleRowIndex
          : prev.findIndex((line) => !line.Code)
      const targetIndex = safeIndex >= 0 ? safeIndex : prev.length
      const rows = safeIndex >= 0 ? [...prev] : [...prev, createEmptyLine()]

      const qte = 1
      const totalNetHT = qte * pu * (1 - remise / 100)

      rows[targetIndex] = {
        ...rows[targetIndex],
        Code: article.CODE,
        Designation: article.LIBELL,
        CodeTVA: codeTva,
        AnneeTaxe: anneeTaxe,
        Qte: qte,
        PU_HT: pu,
        Remise: remise,
        TVA: tva,
        TotalNetHT: totalNetHT,
      }

      if (!rows.some((line) => !line.Code)) rows.push(createEmptyLine())
      return rows
    })

    setArticleRowIndex(null)
    setIsArticleModalOpen(false)
  }

  const handleSubmit = async () => {
    const validLines = details.filter((d) => d.Code && toNumber(d.Qte) > 0)
    if (!header.NOMTIE.trim()) {
      setError('Le nom du client est obligatoire.')
      return
    }
    if (!header.TELCLI || header.TELCLI.length !== 8) {
      setError('Le téléphone du client est obligatoire (8 chiffres).')
      return
    }
    if (validLines.length === 0) {
      setError('Ajoutez au moins un article avec une quantité.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const payload = {
        ...header,
        details: validLines.map((d) => ({
          Code: d.Code,
          Designation: d.Designation,
          CodeTVA: d.CodeTVA,
          Qte: Math.max(0, toNumber(d.Qte)),
          PU_HT: Math.max(0, toNumber(d.PU_HT)),
          Remise: normalizeRate(d.Remise),
          TVA: normalizeRate(d.TVA),
        })),
      }

      const response = await apiFetch('/devis', {
        method: 'POST',
        body: payload,
        auth: true,
      })

      if (response.ok) {
        const result = await response.json()
        setCreatedNumero(result.NUMERO)
        setSuccess(true)
        navigate(`/devis/${result.NUMERO}`)
      } else {
        const data = await response.json().catch(() => ({}))
        setError(data.message || 'Erreur lors de la création du devis.')
      }
    } catch (err) {
      console.error('Error creating devis:', err)
      setError('Impossible de joindre le serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(0,82,204,0.08),_transparent_26%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6">
          <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/88 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-6 p-6 lg:p-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#0052CC]">
                  <span className="rounded-full bg-blue-50 px-3 py-1">Devis</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">Création structurée</span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                    Nouveau devis
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                    Créez un devis clair, homogène et prêt à l’envoi grâce à une interface pensée comme un espace de travail SaaS premium.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row xl:flex-col xl:items-end">
                <button
                  onClick={() => navigate('/devis')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  <ChevronLeft size={18} />
                  Retour à la liste
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0052CC] px-6 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(0,82,204,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#0747A6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                  Enregistrer le devis
                </button>
              </div>
            </div>

            <div className="grid gap-4 border-t border-slate-100 p-6 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Lignes actives</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{activeLines.length}</div>
                <p className="mt-1 text-xs font-medium text-slate-500">Articles remplis et comptabilisés</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Lignes vides</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{openLines}</div>
                <p className="mt-1 text-xs font-medium text-slate-500">Emplacements disponibles pour ajout rapide</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Total net HT</div>
                <div className="mt-2 text-2xl font-black text-emerald-700">{formatCurrency(totals.totalNetHT)}</div>
                <p className="mt-1 text-xs font-medium text-emerald-700/70">Base hors taxes calculée</p>
              </div>
              <div className="rounded-2xl border border-[#0052CC]/15 bg-[#0052CC]/8 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0052CC]">Total TTC</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{formatCurrency(totals.totalTTC)}</div>
                <p className="mt-1 text-xs font-medium text-slate-500">Inclut TVA et droit de timbre</p>
              </div>
            </div>
          </section>

          {success && (
            <div className="flex items-start gap-3 rounded-[24px] border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-700 shadow-sm">
              <div className="rounded-2xl bg-white p-2 text-emerald-500 shadow-sm">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-sm font-black">Devis créé avec succès</p>
                <p className="mt-1 text-sm font-medium text-emerald-700/80">
                  Devis {createdNumero} créé avec succès ! Redirection vers les détails...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-[24px] border border-red-200 bg-red-50/90 p-4 text-red-700 shadow-sm">
              <div className="rounded-2xl bg-white p-2 text-red-500 shadow-sm">
                <AlertCircle size={22} />
              </div>
              <div>
                <p className="text-sm font-black">Erreur de validation</p>
                <p className="mt-1 text-sm font-medium text-red-700/80">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-8">
              <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/92 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0052CC]">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-[0.25em] text-slate-900 sm:tracking-[0.3em]">Informations client</h2>
                      <p className="mt-1 text-xs font-medium text-slate-500">Identité du client, contact et dates clés</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-5 sm:p-6">
                  {/* Bloc 1 : identité client */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        <User size={12} className="text-[#0052CC]" /> Client (Nom) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="NOMTIE"
                        value={header.NOMTIE}
                        onChange={handleHeaderChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        placeholder="Nom du client..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        <Phone size={12} className="text-[#0052CC]" /> Téléphone client
                      </label>
                      <div className="flex items-stretch overflow-hidden rounded-2xl border border-slate-200 transition-all focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-500/10">
                        <span className="flex shrink-0 items-center bg-slate-100 px-3 text-sm font-bold text-slate-600 select-none">+216</span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={8}
                          value={header.TELCLI}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
                            setHeader((prev) => ({ ...prev, TELCLI: digits }))
                          }}
                          className="w-full bg-slate-50/80 px-3 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                          placeholder="12 345 678"
                        />
                      </div>
                      {header.TELCLI && header.TELCLI.length > 0 && header.TELCLI.length < 8 && (
                        <p className="text-[10px] font-bold text-amber-500">Le numéro doit contenir 8 chiffres ({header.TELCLI.length}/8)</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        <Building2 size={12} className="text-[#0052CC]" /> Région
                      </label>
                      <select
                        name="Region"
                        value={header.Region}
                        onChange={handleHeaderChange}
                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      >
                        <option value="">— Sélectionner —</option>
                        <option value="Ariana">Ariana</option>
                        <option value="Béja">Béja</option>
                        <option value="Ben Arous">Ben Arous</option>
                        <option value="Bizerte">Bizerte</option>
                        <option value="Gabès">Gabès</option>
                        <option value="Gafsa">Gafsa</option>
                        <option value="Jendouba">Jendouba</option>
                        <option value="Kairouan">Kairouan</option>
                        <option value="Kasserine">Kasserine</option>
                        <option value="Kébili">Kébili</option>
                        <option value="Le Kef">Le Kef</option>
                        <option value="Mahdia">Mahdia</option>
                        <option value="La Manouba">La Manouba</option>
                        <option value="Médenine">Médenine</option>
                        <option value="Monastir">Monastir</option>
                        <option value="Nabeul">Nabeul</option>
                        <option value="Sfax">Sfax</option>
                        <option value="Sidi Bouzid">Sidi Bouzid</option>
                        <option value="Siliana">Siliana</option>
                        <option value="Sousse">Sousse</option>
                        <option value="Tataouine">Tataouine</option>
                        <option value="Tozeur">Tozeur</option>
                        <option value="Tunis">Tunis</option>
                        <option value="Zaghouan">Zaghouan</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        <User size={12} className="text-emerald-600" /> Commercial
                      </label>
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 px-4 py-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">
                          {(commercialName || '—').trim().charAt(0).toUpperCase() || '—'}
                        </span>
                        <span className="truncate text-sm font-bold text-slate-700">
                          {commercialName || 'Non identifié'}
                        </span>
                        <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">Auto</span>
                      </div>
                    </div>
                  </div>

                  {/* Bloc 2 : dates */}
                  <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        <Calendar size={12} className="text-[#0052CC]" /> Date document
                      </label>
                      <input
                        type="date"
                        name="DATDOC"
                        value={header.DATDOC}
                        onChange={handleHeaderChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        <Truck size={12} className="text-[#0052CC]" /> Livraison prévue
                      </label>
                      <input
                        type="date"
                        name="DATLIV"
                        value={header.DATLIV}
                        onChange={handleHeaderChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/92 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                      <Package size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900">Articles du devis</h2>
                      <p className="mt-1 text-xs font-medium text-slate-500">Ajoutez les lignes, ajustez les remises et contrôlez les montants</p>
                    </div>
                  </div>
                  <button
                    onClick={addLine}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.25em] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#0052CC]"
                  >
                    <Plus size={16} /> Ajouter une ligne
                  </button>
                </div>

                {/* Vue desktop : tableau (xl et plus) */}
                <div className="hidden overflow-x-auto xl:block">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50/70">
                      <tr className="border-b border-slate-100">
                        <th className="w-[18%] px-4 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Article</th>
                        <th className="w-[26%] px-4 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Désignation</th>
                        <th className="w-[8%] px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Qté</th>
                        <th className="w-[12%] px-4 py-4 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">P.U HT</th>
                        <th className="w-[8%] px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Rem (%)</th>
                        <th className="w-[8%] px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">TVA (%)</th>
                        <th className="w-[15%] px-4 py-4 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Total net HT</th>
                        <th className="w-[5%] px-4 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {details.map((item, idx) => (
                        <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-4 py-4 align-top">
                            <div className="space-y-2">
                              <div className="min-h-[16px] text-xs font-black uppercase tracking-[0.25em] text-[#0052CC]">
                                {item.Code || <span className="text-slate-300">—</span>}
                              </div>
                              <button
                                onClick={() => openArticleModal(idx)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-[#0052CC]"
                              >
                                Sélectionner
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <textarea
                              value={item.Designation}
                              onChange={(e) => handleLineChange(idx, 'Designation', e.target.value)}
                              rows={1}
                              className="w-full resize-none rounded-2xl border border-transparent bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                              placeholder="Désignation..."
                              style={{ overflow: 'hidden' }}
                              onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                            />
                          </td>
                          <td className="px-4 py-4 text-center align-top">
                            <input
                              type="number"
                              min="0"
                              value={item.Qte}
                              onChange={(e) => handleLineChange(idx, 'Qte', e.target.value)}
                              className="w-20 rounded-2xl border border-transparent bg-slate-50/80 px-3 py-3 text-center text-sm font-black text-slate-800 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            />
                          </td>
                          <td className="px-4 py-4 text-right align-top">
                            <div className="w-28 rounded-2xl border border-transparent bg-slate-50/80 px-3 py-3 text-right text-sm font-bold tabular-nums text-slate-900">
                              {formatCurrency(item.PU_HT)}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center align-top">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.Remise}
                              onChange={(e) => handleLineChange(idx, 'Remise', e.target.value)}
                              className="w-20 rounded-2xl border border-transparent bg-slate-50/80 px-3 py-3 text-center text-sm font-bold text-amber-600 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            />
                          </td>
                          <td className="px-4 py-4 text-center align-top">
                            <div className="flex flex-col items-center gap-1 rounded-2xl bg-slate-50/80 px-3 py-3">
                              <span className="text-sm font-black text-slate-800">
                                {item.CodeTVA ? item.CodeTVA.trim() : '—'}
                              </span>
                              {resolveTVA(item) > 0 && (
                                <span className="text-[10px] font-bold text-slate-400">{resolveTVA(item)}%</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right align-top">
                            <span className="text-sm font-black text-[#0052CC]">
                              {formatCurrency(item.TotalNetHT)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center align-top">
                            <button
                              onClick={() => removeLine(idx)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-300 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-200 hover:text-red-500 hover:shadow-md"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vue mobile / tablette : cartes empilées (sous xl) */}
                <div className="space-y-4 p-4 sm:p-5 xl:hidden">
                  {details.map((item, idx) => (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0052CC]">
                            {item.Code || <span className="text-slate-300">Aucun article</span>}
                          </div>
                          <button
                            onClick={() => openArticleModal(idx)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:text-[#0052CC]"
                          >
                            <Package size={13} /> Sélectionner
                          </button>
                        </div>
                        <button
                          onClick={() => removeLine(idx)}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-300 shadow-sm transition-all hover:border-red-200 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Désignation</label>
                          <textarea
                            value={item.Designation}
                            onChange={(e) => handleLineChange(idx, 'Designation', e.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            placeholder="Désignation..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Qté</label>
                            <input
                              type="number"
                              min="0"
                              value={item.Qte}
                              onChange={(e) => handleLineChange(idx, 'Qte', e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-center text-sm font-black text-slate-800 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">P.U HT</label>
                            <div className="w-full rounded-2xl border border-slate-200 bg-slate-100/80 px-3 py-3 text-right text-sm font-bold tabular-nums text-slate-900">
                              {formatCurrency(item.PU_HT)}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rem (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.Remise}
                              onChange={(e) => handleLineChange(idx, 'Remise', e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-center text-sm font-bold text-amber-600 outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/80 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">TVA</span>
                            <span className="text-sm font-black text-slate-800">
                              {item.CodeTVA ? item.CodeTVA.trim() : '—'}
                            </span>
                            {resolveTVA(item) > 0 && (
                              <span className="text-[10px] font-bold text-slate-400">{resolveTVA(item)}%</span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total net HT</div>
                            <div className="text-base font-black text-[#0052CC]">{formatCurrency(item.TotalNetHT)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ML Article Recommendations */}
              <ArticleRecommendations
                currentArticles={details}
                onAddArticle={selectArticle}
              />
            </div>

            <aside className="space-y-6 xl:col-span-4 xl:sticky xl:top-6 xl:self-start">
              <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/92 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur">
                <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <Percent size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900">Récapitulatif TVA</h2>
                    <p className="mt-1 text-xs font-medium text-slate-500">Répartition fiscale calculée automatiquement</p>
                  </div>
                </div>
                <div className="p-6">
                  {totals.tvaSummary.length > 0 ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                      <table className="w-full border-collapse text-left">
                        <thead className="bg-slate-50/80">
                          <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                            <th className="px-4 py-3">TVA</th>
                            <th className="px-4 py-3 text-right">Base HT</th>
                            <th className="px-4 py-3 text-right">Montant TVA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                          {totals.tvaSummary.map((t, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="px-4 py-3 text-sm font-bold text-slate-900">TVA {t.taux}%</td>
                              <td className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                                {formatCurrency(t.base)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-black text-slate-900">
                                {formatCurrency(t.montant)}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t border-slate-100 bg-slate-50/80">
                            <td className="px-4 py-3 text-xs font-black uppercase tracking-[0.25em] text-slate-500">Total</td>
                            <td className="px-4 py-3 text-right text-xs font-black text-slate-700">
                              {formatCurrency(totals.tvaSummary.reduce((a, t) => a + t.base, 0))}
                            </td>
                            <td className="px-4 py-3 text-right text-xs font-black text-slate-700">
                              {formatCurrency(totals.totalTVA)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-xs font-medium italic text-slate-400">
                      Aucun article ajouté pour le moment
                    </div>
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-[32px] border border-[#0052CC] bg-[#0052CC] text-white shadow-[0_24px_70px_rgba(0,82,204,0.25)]">
                <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white">
                    <Calculator size={22} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">Calculateur devis</h2>
                    <p className="mt-1 text-xs font-medium text-white/60">Synthèse financière en temps réel</p>
                  </div>
                </div>
                <div className="space-y-3 p-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">Total HT brut</span>
                    <span className="text-base font-black">{formatCurrency(totals.totalHTBrut)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">Total remise</span>
                    <span className="text-base font-black">{formatCurrency(totals.totalRemise)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">Total net HT</span>
                    <span className="text-base font-black">{formatCurrency(totals.totalNetHT)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">Total TVA</span>
                    <span className="text-base font-black">{formatCurrency(totals.totalTVA)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">Droit timbre</span>
                    <span className="text-base font-black">{formatCurrency(totals.timbre)}</span>
                  </div>
                  <div className="flex items-end justify-between gap-4 pt-2">
                    <div>
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.35em] text-white/70">Total TTC</span>
                      <span className="text-[10px] font-bold italic text-white/50">Dinars tunisiens</span>
                    </div>
                    <span className="text-4xl font-black leading-none">{formatCurrency(totals.totalTTC)}</span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading || totals.totalNetHT <= 0}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-black uppercase tracking-[0.25em] text-[#0052CC] shadow-[0_16px_40px_rgba(255,255,255,0.18)] transition-all hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Traitement en cours...' : 'Confirmer et enregistrer'}
                  </button>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {/* Popup de chargement centré pendant la création */}
      {loading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-8 shadow-2xl">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0052CC] border-t-transparent" />
            <p className="text-sm font-black text-slate-900">Création du devis en cours…</p>
            <p className="text-xs text-slate-500">Veuillez patienter.</p>
          </div>
        </div>
      )}

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
