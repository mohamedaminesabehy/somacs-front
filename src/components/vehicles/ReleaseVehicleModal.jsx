import { useEffect, useId, useRef, useState } from 'react'
import { KeyRound, RefreshCw } from 'lucide-react'
import { apiFetch } from '../../api/apiClient'
import Modal from '../ui/Modal'

const MAX_REASON_LENGTH = 500

const STATUS_LABELS = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  ON_HOLD: 'En pause',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
}

function resolveDriverName(mission) {
  const team = Array.isArray(mission?.team) ? mission.team : []
  const driver = team.find((member) => member?.isDriver)
  return driver?.name || mission?.driverName || null
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink">{children}</dd>
    </div>
  )
}

export default function ReleaseVehicleModal({ vehicle, onClose, onReleased }) {
  const reasonId = useId()
  const errorId = useId()
  const textareaRef = useRef(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  const mission = vehicle?.activeMission || null
  const open = Boolean(vehicle && mission)

  useEffect(() => {
    if (!open) return
    setReason('')
    setError('')
  }, [open, vehicle?.id])

  const close = () => {
    if (!submittingRef.current) onClose()
  }

  const confirm = async () => {
    if (submittingRef.current || !mission) return
    const trimmed = reason.trim()
    if (!trimmed) {
      setError('Le motif de restitution est obligatoire.')
      textareaRef.current?.focus()
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    setError('')
    try {
      const res = await apiFetch(`/missions/${mission.id}/release-vehicle`, {
        method: 'PATCH',
        auth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: trimmed }),
      })
      if (res.ok) {
        onReleased(vehicle)
        return
      }
      const body = await res.json().catch(() => ({}))
      const message = Array.isArray(body.message) ? body.message.join(' ') : body.message
      setError(message || 'La restitution a échoué.')
    } catch {
      setError('Serveur injoignable. Réessayez plus tard.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const driverName = resolveDriverName(mission)
  const statusLabel = STATUS_LABELS[mission?.status] || mission?.status || '—'

  return (
    <Modal
      open={open}
      onClose={close}
      dismissible={!submitting}
      initialFocusRef={textareaRef}
      title="Rendre ce véhicule disponible ?"
      description="Restitution administrative exceptionnelle : le véhicule redevient disponible, la mission et son équipe restent inchangées."
      icon={KeyRound}
      size="md"
      footer={
        <>
          <button type="button" className="ui-btn-secondary" onClick={close} disabled={submitting}>Annuler</button>
          <button type="button" className="ui-btn-primary" onClick={confirm} disabled={submitting || !reason.trim()}>
            {submitting ? <RefreshCw size={15} className="animate-spin" aria-hidden="true" /> : <KeyRound size={15} aria-hidden="true" />}
            Confirmer
          </button>
        </>
      }
    >
      {open && (
        <div className="flex flex-col gap-4">
          <dl className="divide-y divide-line rounded-xl border border-line bg-slate-50 px-3">
            <InfoRow label="Véhicule">
              <span className="font-mono">{vehicle.matricule}</span>
              <span className="block text-xs font-medium text-ink-muted">{vehicle.marque} {vehicle.modele}</span>
            </InfoRow>
            <InfoRow label="Mission">
              #{mission.id}{mission.title ? ` — ${mission.title}` : ''}
            </InfoRow>
            <InfoRow label="Statut">{statusLabel}</InfoRow>
            <InfoRow label="Chauffeur">{driverName || 'Aucun chauffeur désigné'}</InfoRow>
          </dl>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={reasonId} className="text-sm font-semibold text-ink">
              Motif de restitution <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <textarea
              id={reasonId}
              ref={textareaRef}
              value={reason}
              onChange={(e) => { setReason(e.target.value); if (error) setError('') }}
              maxLength={MAX_REASON_LENGTH}
              rows={3}
              required
              aria-required="true"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              disabled={submitting}
              placeholder="Ex. : véhicule nécessaire pour une intervention urgente"
              className="ui-input min-h-24 w-full resize-y"
            />
            <div className="flex items-center justify-between gap-3 text-xs">
              {error
                ? <p id={errorId} role="alert" className="font-semibold text-red-700">{error}</p>
                : <span />}
              <span className="text-ink-faint">{reason.length}/{MAX_REASON_LENGTH}</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
