import { useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch } from '../../../api/apiClient'
import { fetchDevisSuiviStatuses } from '../../../api/devisSuiviApi'

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function buildDevisQuery({ page, limit, debouncedSearch, dateFrom, dateTo }) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (debouncedSearch) query.append('search', debouncedSearch)
  if (dateFrom) query.append('dateFrom', dateFrom)
  if (dateTo) query.append('dateTo', dateTo)
  return query.toString()
}

function resolveErrorMessage(err) {
  if (/timeout/i.test(err?.message || '')) {
    return 'Le serveur met trop de temps à répondre. Réessayez ou affinez votre recherche.'
  }
  return 'Impossible de joindre le serveur. Vérifiez votre connexion.'
}

/**
 * Handles devis list data-fetching, CRM statuses, and delete.
 */
export function useDevisListData({ debouncedSearch, dateFrom, dateTo }) {
  const [devis, setDevis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0, validated: 0, cancelled: 0 })
  const [suiviStatuses, setSuiviStatuses] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(null)

  const fetchAbortRef = useRef(null)
  const suiviAbortRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      try { fetchAbortRef.current?.abort() } catch { /* best-effort */ }
      try { suiviAbortRef.current?.abort() } catch { /* best-effort */ }
    }
  }, [])

  const loadSuiviStatuses = useCallback(async (rows) => {
    try { suiviAbortRef.current?.abort() } catch { /* best-effort */ }
    if (!rows?.length) {
      if (isMountedRef.current) setSuiviStatuses({})
      return
    }
    const numeros = rows.map((r) => r.NUMERO).filter(Boolean)
    const controller = new AbortController()
    suiviAbortRef.current = controller
    try {
      const map = await fetchDevisSuiviStatuses(numeros, controller.signal)
      if (!isMountedRef.current || controller.signal.aborted) return
      setSuiviStatuses(map || {})
    } catch (err) {
      if (err?.name === 'AbortError') return
      if (isMountedRef.current) setSuiviStatuses({})
    }
  }, [])

  const applyDevisResult = useCallback((result) => {
    if (result.error) {
      setError(result.error)
      setDevis([])
      return
    }
    setDevis(Array.isArray(result.data) ? result.data : [])
    setPagination((prev) => ({
      ...prev,
      total: Number(result.total || 0),
      totalPages: Number(result.totalPages || 0),
      validated: Number(result.validated ?? 0),
      cancelled: Number(result.cancelled ?? 0),
    }))
    loadSuiviStatuses(result.data)
  }, [loadSuiviStatuses])

  const fetchDevis = useCallback(async (page) => {
    try { fetchAbortRef.current?.abort() } catch { /* best-effort */ }
    const controller = new AbortController()
    fetchAbortRef.current = controller

    if (isMountedRef.current) { setLoading(true); setError(null) }
    try {
      const qs = buildDevisQuery({ page, limit: pagination.limit, debouncedSearch, dateFrom, dateTo })
      const response = await apiFetch(`/devis?${qs}`, { auth: true, signal: controller.signal, timeoutMs: 25_000 })
      if (!isMountedRef.current || controller.signal.aborted) return

      if (response.ok) {
        const result = await response.json()
        if (isMountedRef.current) applyDevisResult(result)
      } else {
        const errData = await response.json().catch(() => ({}))
        if (!isMountedRef.current) return
        setError(response.status === 401
          ? (errData.message || 'Session expirée. Veuillez vous reconnecter.')
          : (errData.message || `Erreur serveur: ${response.status}`))
        setDevis([])
      }
    } catch (err) {
      if (err?.name === 'AbortError' || err?.name === 'TimeoutError') return
      if (!isMountedRef.current) return
      setError(resolveErrorMessage(err))
      setDevis([])
    } finally {
      if (isMountedRef.current && !controller.signal.aborted) setLoading(false)
    }
  }, [debouncedSearch, pagination.limit, applyDevisResult, dateFrom, dateTo])

  useEffect(() => {
    fetchDevis(pagination.page)
  }, [pagination.page, debouncedSearch, dateFrom, dateTo, fetchDevis])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      const response = await apiFetch(`/devis/${encodeURIComponent(deleteTarget)}`, { method: 'DELETE', auth: true })
      if (response.ok) {
        setDevis((prev) => prev.filter((d) => d.NUMERO !== deleteTarget))
        setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }))
        setDeleteSuccess(`Le devis ${deleteTarget} a été supprimé avec succès.`)
        setTimeout(() => setDeleteSuccess(null), 4000)
      } else {
        const data = await response.json().catch(() => ({}))
        setError(data.message || 'Erreur lors de la suppression du devis.')
      }
    } catch {
      setError('Impossible de supprimer le devis. Vérifiez votre connexion.')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return {
    devis, setDevis, loading, error, setError,
    pagination, setPagination, suiviStatuses,
    deleteTarget, setDeleteTarget, deleting, deleteSuccess,
    handleDeleteConfirm, fetchDevis,
  }
}
