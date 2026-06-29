import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  AlertTriangle, BadgeCheck, Loader2, Save, MessageSquareText,
  PhoneCall, RefreshCw, XCircle, Clock, TrendingUp, Edit3, Plus,
  ShoppingCart, ThumbsDown, ChevronDown, ChevronUp, Bell, Zap,
} from 'lucide-react'
import { createDevisSuivi, fetchDevisSuivi, markDevisPurchased, markDevisLost } from '../../api/devisSuiviApi'
import { apiFetch } from '../../api/apiClient'
import {
  STATUS_META, TERMINAL_STATUSES,
  REFUSAL_REASON_META, REFUSAL_REASON_CODE,
  AUTO_REMINDER_DAYS, TIMELINE_ACTION_META,
} from '../../constants/devisSuiviConstants'

import { StatusBadge, PriorityBadge } from './DevisSuiviBadges'
import { TimelineContainer, PremiumAuditTimeline } from './TimelineSystem'

const STATUS_OPTIONS = ['CREATED','SENT','CONTACTED','WAITING','NEGOTIATION','HOT_LEAD','COLD_LEAD','NO_RESPONSE','ACCEPTED','REFUSED','PURCHASED','EXPIRED']

// Statuts non sélectionnables manuellement (gérés automatiquement)
const AUTO_STATUSES = ['CREATED']

// Trie par order pipeline — utilisé UNIQUEMENT pour resolveMainStatus, jamais pour l'affichage
function sortByPipelineOrder(statuses) {
  return [...statuses].sort((a, b) => (STATUS_META[a]?.order ?? 99) - (STATUS_META[b]?.order ?? 99))
}

// Retourne le statut "principal" = le plus avancé dans le pipeline
function resolveMainStatus(selectedStatuses) {
  if (!selectedStatuses || selectedStatuses.length === 0) return 'CREATED'
  return sortByPipelineOrder(selectedStatuses).at(-1)
}

// Ajoute un statut à la fin de la liste en préservant l'ordre d'insertion
function appendStatus(list, status) {
  if (list.includes(status)) return list
  return [...list, status]
}

// Retire un statut de la liste en préservant l'ordre d'insertion
function removeStatus(list, status) {
  return list.filter(s => s !== status)
}

function toDatetimeLocal(v) {
  if (!v) return ''
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function fmt(v) {
  if (!v) return '-'
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function addDays(n) {
  const d = new Date(); d.setDate(d.getDate() + n); d.setHours(9, 0, 0, 0); return d
}

function buildStatusDateMap(logs, selectedStatuses, createdAt, storedStatusDates = {}) {
  const statusDates = { ...(storedStatusDates || {}) }
  if (createdAt) {
    statusDates.CREATED = createdAt
  }

  const allowedStatuses = new Set(Array.isArray(selectedStatuses) ? selectedStatuses : [])
  const orderedLogs = Array.isArray(logs)
    ? [...logs].sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0))
    : []

  for (const log of orderedLogs) {
    const previousStatus = log?.oldData?.status
    const nextStatus = log?.newData?.status

    if (nextStatus && allowedStatuses.has(nextStatus) && !statusDates[nextStatus]) {
      statusDates[nextStatus] = log.createdAt
    }

    if (
      previousStatus === 'CREATED' &&
      !statusDates.CREATED &&
      log.createdAt
    ) {
      statusDates.CREATED = log.createdAt
    }
  }

  return statusDates
}

// ─── Multi-Status Selector ────────────────────────────────────────────────────
function MultiStatusSelector({ selectedStatuses, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const selectableOptions = STATUS_OPTIONS.filter(s => !AUTO_STATUSES.includes(s))

  const toggle = (status) => {
    if (disabled) return
    const next = selectedStatuses.includes(status)
      ? removeStatus(selectedStatuses, status)
      : appendStatus(selectedStatuses, status)
    onChange(next)
  }

  // Afficher dans l'ordre d'insertion (sans CREATED qui est auto)
  const displayStatuses = selectedStatuses.filter(s => !AUTO_STATUSES.includes(s))

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 disabled:opacity-60 flex items-center justify-between gap-2 min-h-[48px]"
      >
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {displayStatuses.length === 0 ? (
            <span className="text-slate-400 font-medium">Sélectionner des statuts...</span>
          ) : (
            displayStatuses.map(s => {
              const meta = STATUS_META[s]
              return (
                <span key={s} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${meta?.tone}`}>
                  {meta?.label || s}
                </span>
              )
            })
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="p-2 max-h-64 overflow-y-auto">
              {selectableOptions.map(s => {
                const meta = STATUS_META[s]
                const checked = selectedStatuses.includes(s)
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggle(s)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${checked ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                      {checked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${meta?.dot}`} />
                    <span className="text-slate-900">{meta?.label || s}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Horizontal Status Timeline ──────────────────────────────────────────────
export function HorizontalStatusTimeline({ selectedStatuses, createdAt, statusDates = {} }) {
  // CREATED toujours en premier, puis les autres dans l'ordre d'insertion
  const otherStatuses = selectedStatuses.filter(s => s !== 'CREATED')
  const timelineItems = [
    { status: 'CREATED', date: createdAt, isAuto: true },
    ...otherStatuses.map(s => ({ status: s, date: null, isAuto: false })),
  ]
  if (timelineItems.length === 0) return null

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-start min-w-full gap-0">
        {timelineItems.map((item, idx) => {
          const meta = STATUS_META[item.status]
          const isLast = idx === timelineItems.length - 1
          const isFirst = idx === 0
          const effectiveDate = statusDates[item.status] || item.date || null
          return (
            <div key={item.status} className="flex min-w-[11rem] flex-1 items-start">
              {/* Step */}
              <div className="flex w-full flex-col items-center px-1">
                {/* Node + line row */}
                <div className="flex items-center w-full">
                  {/* Left line */}
                  <div className={`flex-1 h-0.5 ${isFirst ? 'bg-transparent' : 'bg-slate-200'}`} />
                  {/* Circle */}
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 z-10 shadow-sm
                    ${item.isAuto
                      ? 'bg-white border-slate-300'
                      : `bg-white ${meta?.tone?.includes('border') ? '' : 'border-slate-200'}`
                    }`}
                    style={{ borderColor: undefined }}
                  >
                    <span className={`w-3 h-3 rounded-full ${meta?.dot}`} />
                  </div>
                  {/* Right line */}
                  <div className={`flex-1 h-0.5 ${isLast ? 'bg-transparent' : 'bg-slate-200'}`} />
                </div>
                {/* Label */}
                <div className="mt-2 flex flex-col items-center gap-1 px-1">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-center ${meta?.tone}`}>
                    {meta?.label || item.status}
                  </span>
                  {item.isAuto && (
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Auto</span>
                  )}
                  {effectiveDate ? (
                    <span className="text-[9px] font-medium text-slate-400 text-center">{fmt(effectiveDate)}</span>
                  ) : !item.isAuto ? (
                    <span className="text-[9px] font-medium text-slate-400 italic">En attente</span>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Local Status Timeline (vertical, kept for internal form use) ─────────────
function LocalStatusTimeline({ selectedStatuses, createdAt, statusDates = {} }) {
  // CREATED toujours en premier, puis les autres dans l'ordre d'insertion
  const otherStatuses = selectedStatuses.filter(s => s !== 'CREATED')
  const timelineItems = [
    { status: 'CREATED', date: createdAt, isAuto: true },
    ...otherStatuses.map(s => ({ status: s, date: null, isAuto: false })),
  ]

  if (timelineItems.length === 0) return null

  return (
    <div className="space-y-0">
      {timelineItems.map((item, idx) => {
        const meta = STATUS_META[item.status]
        const isLast = idx === timelineItems.length - 1
        const effectiveDate = statusDates[item.status] || item.date || null
        return (
          <div key={item.status} className="flex gap-3">
            {/* Connector */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${item.isAuto ? 'bg-slate-100 border-slate-300' : `border-2 ${meta?.tone}`}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${meta?.dot}`} />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1 min-h-[20px]" />}
            </div>
            {/* Content */}
            <div className={`pb-4 flex-1 ${isLast ? '' : ''}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${meta?.tone}`}>
                  {meta?.label || item.status}
                </span>
                {item.isAuto && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Auto</span>
                )}
              </div>
              {effectiveDate ? (
                <p className="mt-1 text-[11px] font-medium text-slate-400">{fmt(effectiveDate)}</p>
              ) : !item.isAuto ? (
                <p className="mt-1 text-[11px] font-medium text-slate-400 italic">En attente de date</p>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ConfirmModal({ open, title, description, confirmLabel, onConfirm, onCancel, busy, danger }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={"flex h-11 w-11 items-center justify-center rounded-2xl " + (danger ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600')}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Confirmation</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">{title}</h3>
            </div>
          </div>
        </div>
        <div className="px-6 py-5"><p className="text-sm font-medium leading-6 text-slate-600">{description}</p></div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60">
            Annuler
          </button>
          <button type="button" onClick={onConfirm} disabled={busy}
            className={"inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white transition-all disabled:opacity-70 " + (danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#0052CC] hover:bg-[#0747A6]')}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
            {busy ? 'Traitement...' : (confirmLabel || 'Confirmer')}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdvancedAuditTimeline({ suiviId }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!suiviId) { setLoading(false); return }
    let mounted = true
    apiFetch('/devis-suivi/' + suiviId + '/history', { auth: true })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (mounted) setLogs(Array.isArray(d?.items) ? d.items : []) })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [suiviId])

  return (
    <TimelineContainer
      logs={logs}
      loading={loading}
      actionMeta={TIMELINE_ACTION_META}
      statusMeta={STATUS_META}
      maxVisible={4}
    />
  )
}

export function DevisSuiviTimeline({ devis, selectedStatuses: selectedStatusesProp }) {
  const init = useMemo(() => defaultDraft(devis), [devis])
  const [loading, setLoading] = useState(true)
  const [recordExists, setRecordExists] = useState(false)
  const [internalStatuses, setInternalStatuses] = useState(['CREATED'])
  const [statusDates, setStatusDates] = useState({})

  // Si le parent contrôle les statuts, on les utilise directement
  const selectedStatuses = selectedStatusesProp ?? internalStatuses

  useEffect(() => {
    let mounted = true
    if (!init.numeroDevis || !init.typDoc) {
      setRecordExists(false)
      setLoading(false)
      setStatusDates({})
      return undefined
    }
    const loadTimeline = async () => {
      setLoading(true)
      try {
        const data = await fetchDevisSuivi(init.numeroDevis, init.typDoc)
        if (!mounted) return

        setRecordExists(true)

        const stored = getStoredStatuses(init.numeroDevis, init.typDoc)
        const nextStatuses = selectedStatusesProp !== undefined
          ? selectedStatusesProp
          : (stored || (data.status ? ['CREATED', data.status].filter((s, i, a) => a.indexOf(s) === i) : ['CREATED']))

        setInternalStatuses(nextStatuses)

        const historyResponse = await apiFetch(`/devis-suivi/${data.id}/history`, { auth: true })
        const historyPayload = historyResponse.ok ? await historyResponse.json().catch(() => null) : null
        const historyLogs = Array.isArray(historyPayload?.items) ? historyPayload.items : []
        // Prefer server-provided selectedStatusesHistory, fallback to localStorage
        const storedStatusDates = getStoredStatusDates(init.numeroDevis, init.typDoc) || {}
        const serverStatusDates = parseServerStatusesHistory(data.selectedStatusesHistory) || {}
        const mergedStored = Object.keys(serverStatusDates).length > 0 ? serverStatusDates : storedStatusDates
        const dates = buildStatusDateMap(historyLogs, nextStatuses, data.createdAt || init.createdAt, mergedStored)
        if (mounted) {
          setStatusDates(dates)
        }
      } catch {
        if (!mounted) return
        setRecordExists(false)
        setStatusDates({})
        const stored = getStoredStatuses(init.numeroDevis, init.typDoc)
        setInternalStatuses(selectedStatusesProp !== undefined ? selectedStatusesProp : (stored || ['CREATED']))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadTimeline()
    return () => { mounted = false }
  }, [init.createdAt, init.numeroDevis, init.typDoc, selectedStatusesProp])

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Historique</div>
        <h3 className="mt-1 text-lg font-black text-slate-950">Timeline des statuts</h3>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {recordExists ? 'Suivi actif — statuts synchronisés.' : 'Aucun suivi enregistré pour ce devis.'}
        </p>
      </div>
      <div className="px-6 py-6">
        {loading ? (
          <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
            <Loader2 size={14} className="animate-spin" /> Chargement...
          </div>
        ) : (
          <HorizontalStatusTimeline
            selectedStatuses={selectedStatuses}
            createdAt={devis?.createdAt}
            statusDates={statusDates}
          />
        )}
      </div>
    </section>
  )
}

const defaultDraft = (d) => {
  const numeroDevis = d?.numeroDevis || d?.NUMERO || ''
  const typDoc = d?.typDoc || d?.TYPDOC || ''
  // Toujours lire le localStorage en premier pour ne pas perdre les statuts sauvegardés
  const storedStatuses = getStoredStatuses(numeroDevis, typDoc)
  const fallbackStatus = d?.status || 'CREATED'
  const selectedStatuses = storedStatuses || (fallbackStatus !== 'CREATED'
    ? ['CREATED', fallbackStatus]
    : ['CREATED'])
  const storedStatusDates = getStoredStatusDates(numeroDevis, typDoc) || {}
  return {
    numeroDevis,
    typDoc,
    clientCode: d?.clientCode || d?.CODTIE || '',
    commercialCode: d?.commercialCode || d?.CODREP || '',
    status: fallbackStatus,
    selectedStatuses,
    reasonRefusal: d?.reasonRefusal || '',
    refusalReasonCode: d?.refusalReasonCode || '',
    noteCommerciale: d?.noteCommerciale || '',
    nextAction: d?.nextAction || '',
    reminderDate: toDatetimeLocal(d?.reminderDate),
    reminderComment: d?.reminderComment || '',
    statusDates: storedStatusDates,
  }
}

// ─── localStorage helpers for selectedStatuses ────────────────────────────────
function getStoredStatuses(numeroDevis, typDoc) {
  try {
    const key = `devis_statuses_${numeroDevis}_${typDoc}`
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // Stored statuses are optional.
  }
  return null
}

function setStoredStatuses(numeroDevis, typDoc, statuses) {
  try {
    const key = `devis_statuses_${numeroDevis}_${typDoc}`
    localStorage.setItem(key, JSON.stringify(statuses))
  } catch {
    // Stored statuses are optional.
  }
}

function getStoredStatusDates(numeroDevis, typDoc) {
  try {
    const key = `devis_status_dates_${numeroDevis}_${typDoc}`
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
  } catch {
    // Stored status dates are optional.
  }
  return null
}

function setStoredStatusDates(numeroDevis, typDoc, statusDates) {
  try {
    const key = `devis_status_dates_${numeroDevis}_${typDoc}`
    localStorage.setItem(key, JSON.stringify(statusDates || {}))
  } catch {
    // Stored status dates are optional.
  }
}

function mergeStatusDates(existingDates, selectedStatuses) {
  const nextDates = { ...(existingDates || {}) }
  const nowIso = new Date().toISOString()

  if (Array.isArray(selectedStatuses)) {
    selectedStatuses.forEach((status) => {
      if (status === 'CREATED') {
        if (!nextDates.CREATED) nextDates.CREATED = nowIso
        return
      }
      if (!nextDates[status]) nextDates[status] = nowIso
    })
  }

  return nextDates
}

function parseServerStatusesHistory(jsonString) {
  try {
    if (!jsonString) return null
    const parsed = JSON.parse(jsonString)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    // Server status history is optional.
  }
  return null
}
export default function DevisSuiviSection({ devis, enableTimeline = true, onStatusesChange }) {
  const init = useMemo(() => defaultDraft(devis), [devis])
  const [draft, setDraft] = useState(init)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmPurchased, setConfirmPurchased] = useState(false)
  const [confirmLost, setConfirmLost] = useState(false)
  const [recordExists, setRecordExists] = useState(false)
  const [suiviId, setSuiviId] = useState(null)
  const [showTimeline, setShowTimeline] = useState(false)

  // Sync uniquement les champs non-statuts si devis change (ex: montant recalculé)
  // Ne jamais écraser selectedStatuses depuis init — déjà géré dans defaultDraft via localStorage
  useEffect(() => {
    setDraft(prev => ({
      ...prev,
      numeroDevis: init.numeroDevis,
      typDoc: init.typDoc,
      clientCode: init.clientCode,
      commercialCode: init.commercialCode,
    }))
  }, [init.numeroDevis, init.typDoc]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSuivi = useCallback(async () => {
    if (!init.numeroDevis || !init.typDoc) { setLoading(false); setRecordExists(false); return }
    try {
      const data = await fetchDevisSuivi(init.numeroDevis, init.typDoc)
      setRecordExists(true); setSuiviId(data.id || null)
      // Priorité : localStorage > statuts dérivés de l'API
      // On ne rétrograde jamais : on fusionne le statut API avec les statuts stockés
      const storedStatuses = getStoredStatuses(init.numeroDevis, init.typDoc)
      const storedStatusDates = getStoredStatusDates(init.numeroDevis, init.typDoc) || {}
      const apiStatus = data.status || 'CREATED'
      let selectedStatuses
      if (storedStatuses) {
        // Ajouter le statut API à la fin s'il n'est pas déjà dans la liste stockée
        selectedStatuses = storedStatuses.includes(apiStatus)
          ? storedStatuses
          : appendStatus(storedStatuses, apiStatus)
      } else {
        selectedStatuses = apiStatus !== 'CREATED'
          ? ['CREATED', apiStatus]
          : ['CREATED']
      }

      // Charger selectedStatusesHistory du backend et fallback à localStorage
      const serverStatusDates = parseServerStatusesHistory(data.selectedStatusesHistory) || {}
      const finalStatusDates = Object.keys(serverStatusDates).length > 0 ? serverStatusDates : storedStatusDates

      setDraft(prev => ({
        ...prev,
        ...data,
        // Toujours préserver les selectedStatuses calculés — ne pas les écraser avec data
        selectedStatuses,
        status: resolveMainStatus(selectedStatuses),
        reasonRefusal: data.reasonRefusal || '',
        refusalReasonCode: data.refusalReasonCode || '',
        noteCommerciale: data.noteCommerciale || '',
        nextAction: data.nextAction || '',
        reminderDate: toDatetimeLocal(data.reminderDate),
        reminderComment: data.reminderComment || '',
        statusDates: buildStatusDateMap([], selectedStatuses, data.createdAt || init.createdAt, finalStatusDates),
      }))
      // Notifier le parent immédiatement au chargement
      onStatusesChange?.(selectedStatuses)
    } catch { setRecordExists(false) }
    finally { setLoading(false) }
  }, [init.numeroDevis, init.typDoc]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadSuivi() }, [loadSuivi])

  const mainStatus = resolveMainStatus(draft.selectedStatuses)
  const statusMeta = STATUS_META[mainStatus] || STATUS_META.CREATED
  const isClosed = TERMINAL_STATUSES.includes(mainStatus)
  const isPurchased = mainStatus === 'PURCHASED'
  const isRefused = mainStatus === 'REFUSED'

  const showToast = (type, msg) => {
    setToast({ type, msg })
    window.setTimeout(() => setToast(null), 3200)
  }

  const set = (key, value) => {
    if (typeof key === 'object') {
      setDraft(prev => ({ ...prev, ...key }))
      return
    }
    setDraft(prev => ({ ...prev, [key]: value }))
  }


  const applyAutoReminder = (status) => {
    const days = AUTO_REMINDER_DAYS[status]
    if (days && !draft.reminderDate) {
      set('reminderDate', toDatetimeLocal(addDays(days)))
      showToast('success', 'Relance auto definie dans ' + days + ' jours.')
    }
  }

  const handleStatusesChange = (newStatuses) => {
    // newStatuses vient du toggle — ordre d'insertion préservé
    // Garantir CREATED en première position
    const withCreated = newStatuses.includes('CREATED') ? newStatuses : ['CREATED', ...newStatuses]
    const main = resolveMainStatus(withCreated)
    setDraft(p => ({
      ...p,
      selectedStatuses: withCreated,
      status: main,
      statusDates: mergeStatusDates(p.statusDates, withCreated),
    }))
    applyAutoReminder(main)
    onStatusesChange?.(withCreated)
  }

  const persist = async () => {
    if (!draft.numeroDevis || !draft.typDoc) { showToast('error', 'Numero et type requis.'); return }
    try {
      setSaving(true)
      const finalStatuses = draft.selectedStatuses || [mainStatus]
      const finalStatusDates = mergeStatusDates(draft.statusDates, finalStatuses)
      const payload = {
        numeroDevis: draft.numeroDevis, typDoc: draft.typDoc,
        clientCode: draft.clientCode || devis?.CODTIE || '',
        commercialCode: draft.commercialCode || devis?.CODREP || '',
        status: mainStatus,
        reasonRefusal: mainStatus === 'REFUSED' ? draft.reasonRefusal : (draft.reasonRefusal || ''),
        refusalReasonCode: mainStatus === 'REFUSED' ? (draft.refusalReasonCode || undefined) : undefined,
        noteCommerciale: draft.noteCommerciale || '',
        nextAction: draft.nextAction || '',
        reminderDate: draft.reminderDate || null,
        reminderComment: draft.reminderComment || '',
        selectedStatuses: finalStatusDates, // Envoyer les statuts avec leurs dates
      }
      const saved = await createDevisSuivi(payload)
      setStoredStatuses(draft.numeroDevis, draft.typDoc, finalStatuses)
      setStoredStatusDates(draft.numeroDevis, draft.typDoc, finalStatusDates)
      onStatusesChange?.(finalStatuses)
      setRecordExists(true); setSuiviId(saved.id || null)
      setDraft(prev => ({ ...prev, ...saved, selectedStatuses: finalStatuses, statusDates: finalStatusDates, reminderDate: toDatetimeLocal(saved.reminderDate), refusalReasonCode: saved.refusalReasonCode || '', reminderComment: saved.reminderComment || '' }))
      showToast('success', 'Suivi commercial enregistré.')
    } catch (e) { showToast('error', e?.message || "Impossible d'enregistrer.") }
    finally { setSaving(false); setConfirmOpen(false) }
  }

  const handleSave = () => {
    if (mainStatus === 'REFUSED' || mainStatus === 'PURCHASED') { setConfirmOpen(true); return }
    persist()
  }

  const handleMarkPurchased = async () => {
    if (!suiviId) { showToast('error', "Enregistrez d'abord le suivi."); return }
    try {
      setActionBusy(true)
      const saved = await markDevisPurchased(suiviId)
      setDraft(prev => ({ ...prev, ...saved, reminderDate: toDatetimeLocal(saved.reminderDate) }))
      showToast('success', 'Devis marque comme achete.'); setConfirmPurchased(false)
    } catch (e) { showToast('error', e?.message || 'Impossible de marquer comme achete.') }
    finally { setActionBusy(false) }
  }

  const handleMarkLost = async () => {
    if (!suiviId) { showToast('error', "Enregistrez d'abord le suivi."); return }
    try {
      setActionBusy(true)
      const saved = await markDevisLost(suiviId, draft.reasonRefusal, draft.refusalReasonCode || undefined)
      setDraft(prev => ({ ...prev, ...saved, reminderDate: toDatetimeLocal(saved.reminderDate) }))
      showToast('success', 'Devis marque comme perdu.'); setConfirmLost(false)
    } catch (e) { showToast('error', e?.message || 'Impossible de marquer comme perdu.') }
    finally { setActionBusy(false) }
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Suivi commercial</div>
          <h3 className="mt-1 text-lg font-black text-slate-950">Pilotage du devis</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {recordExists ? 'Suivi actif — modifications sauvegardees.' : 'Aucun suivi enregistre pour ce devis.'}
          </p>
        </div>
        <div className={"inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] " + statusMeta.tone}>
          {isPurchased ? <BadgeCheck size={13} /> : isRefused ? <XCircle size={13} /> : <PhoneCall size={13} />}
          {statusMeta.label}
        </div>
      </div>

      {/* Context summary */}
      {recordExists && (
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 px-6 py-4 sm:grid-cols-4">
          {[
            ['Commercial', draft.commercialCode || devis?.commercialLabel || '-'],
            ['Cree le', fmt(draft.createdAt)],
            ['Derniere MAJ', fmt(draft.updatedAt)],
            ['Relance prevue', fmt(draft.reminderDate)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">{label}</div>
              <div className="mt-1 text-sm font-bold text-slate-900 truncate">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      {recordExists && !isClosed && (
        <div className="flex flex-wrap gap-3 border-b border-slate-100 px-6 py-4">
          <button type="button" onClick={() => setConfirmPurchased(true)} disabled={actionBusy}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60">
            {actionBusy ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
            Marquer achete
          </button>
          <button type="button" onClick={() => setConfirmLost(true)} disabled={actionBusy}
            className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-700 disabled:opacity-60">
            {actionBusy ? <Loader2 size={15} className="animate-spin" /> : <ThumbsDown size={15} />}
            Marquer perdu
          </button>
        </div>
      )}

      {/* Closed banner */}
      {isClosed && (
        <div className={"mx-6 mt-4 rounded-[20px] border p-4 " + (isPurchased ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800' : 'border-rose-200 bg-rose-50/80 text-rose-800')}>
          <div className="flex items-center gap-3">
            {isPurchased ? <BadgeCheck size={18} /> : <XCircle size={18} />}
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em]">{isPurchased ? 'Achete' : 'Perdu'}</div>
              <p className="mt-0.5 text-sm font-semibold">
                {isPurchased ? 'Ce devis est converti en achat.' : ('Raison : ' + (REFUSAL_REASON_META[draft.refusalReasonCode]?.label || draft.reasonRefusal || 'Non precisee'))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main form */}
      <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">

          {/* Status + reminder row */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Statuts</div>
              <MultiStatusSelector
                selectedStatuses={draft.selectedStatuses || ['CREATED']}
                onChange={handleStatusesChange}
                disabled={isClosed}
              />
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Date rappel</div>
              <input type="datetime-local" value={draft.reminderDate ?? ''} onChange={e => set('reminderDate', e.target.value)}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15" />
            </div>
          </div>

          {/* Timeline locale des statuts sélectionnés */}
          {(draft.selectedStatuses?.length > 0) && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Timeline des statuts</div>
              <LocalStatusTimeline
                selectedStatuses={draft.selectedStatuses || ['CREATED']}
                createdAt={draft.createdAt || devis?.createdAt}
                statusDates={draft.statusDates || {}}
              />
            </div>
          )}

          {/* Refusal reason (only when REFUSED) */}
          {mainStatus === 'REFUSED' && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-3">Raison du refus</div>
              <select value={draft.refusalReasonCode ?? ''} onChange={e => set('refusalReasonCode', e.target.value)}
                className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10">
                <option value="">Selectionner un motif</option>
                {Object.entries(REFUSAL_REASON_META).map(([k, m]) => <option key={k} value={k}>{m.emoji} {m.label}</option>)}
              </select>
              <input type="text" value={draft.reasonRefusal ?? ''} onChange={e => set('reasonRefusal', e.target.value)}
                placeholder="Commentaire optionnel..."
                className="mt-3 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10" />
            </div>
          )}

          {/* Removed: Prochaine action + Note relance per request */}

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">
              <MessageSquareText size={14} /> Notes commerciales
            </div>
            <textarea rows={4} value={draft.noteCommerciale ?? ''} onChange={e => set('noteCommerciale', e.target.value)}
              placeholder="Synthese du contact, objections, elements de decision..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0052CC] focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-100 bg-slate-50/90 p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Contexte</div>
            <div className="space-y-3 text-sm">
              {[
                ['Numero devis', draft.numeroDevis || '-'],
                ['Client', devis?.clientLabel || devis?.NOMTIE || draft.clientCode || '-'],
                ['Commercial', devis?.commercialLabel || draft.commercialCode || '-'],
                ['Montant', new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(Number(devis?.montantDevis || 0))],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                  <span className="font-semibold text-slate-500">{label}</span>
                  <span className="font-black text-slate-900 truncate max-w-[55%] text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleSave} disabled={saving || loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0052CC] px-5 py-3.5 text-sm font-black text-white shadow-[0_18px_40px_rgba(0,82,204,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#0747A6] disabled:opacity-70">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>

        </div>
      </div>

      {enableTimeline && showTimeline && (
        <div className="border-t border-slate-100 px-6 py-5">
          <button type="button" onClick={() => setShowTimeline(v => !v)}
            className="flex w-full items-center justify-between gap-3 text-left">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Historique</div>
              <h4 className="mt-0.5 text-sm font-black text-slate-900">Timeline des evenements</h4>
            </div>
            {showTimeline ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>
          {showTimeline && (
            <div className="mt-4">
              {suiviId ? <AdvancedAuditTimeline suiviId={suiviId} /> : (
                <div className="rounded-2xl border border-dashed border-slate-200 py-6 text-center">
                  <Clock size={20} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium text-slate-400">Enregistrez le suivi pour voir l'historique.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="border-t border-slate-100 px-6 py-4 text-sm font-semibold text-slate-500 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Chargement du suivi...
        </div>
      )}

      {/* Modals */}
      <ConfirmModal open={confirmOpen}
        title={mainStatus === 'PURCHASED' ? "Confirmer l'achat ?" : 'Confirmer le refus ?'}
        description={mainStatus === 'PURCHASED' ? 'Le statut PURCHASED marque ce devis comme converti.' : 'Le statut REFUSED enregistre le devis comme refuse.'}
        confirmLabel="Valider" onConfirm={persist} onCancel={() => setConfirmOpen(false)} busy={saving} />

      <ConfirmModal open={confirmPurchased}
        title="Marquer comme achete ?"
        description={'Le devis ' + draft.numeroDevis + ' sera marque ACHETE. Les relances futures seront annulees.'}
        confirmLabel="Confirmer l'achat" onConfirm={handleMarkPurchased} onCancel={() => setConfirmPurchased(false)} busy={actionBusy} />

      <ConfirmModal open={confirmLost} danger
        title="Marquer comme perdu ?"
        description={'Le devis ' + draft.numeroDevis + ' sera marque PERDU. Les relances futures seront annulees.'}
        confirmLabel="Confirmer la perte" onConfirm={handleMarkLost} onCancel={() => setConfirmLost(false)} busy={actionBusy} />

      {toast && (
        <div className={"fixed bottom-6 right-6 z-[140] max-w-sm rounded-2xl border px-4 py-3 shadow-2xl " + (toast.type === 'success' ? 'border-emerald-200 bg-white text-emerald-700' : 'border-red-200 bg-white text-red-700')}>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{toast.type === 'success' ? 'Succes' : 'Erreur'}</div>
          <div className="mt-1 text-sm font-semibold">{toast.msg}</div>
        </div>
      )}
    </section>
  )
}
