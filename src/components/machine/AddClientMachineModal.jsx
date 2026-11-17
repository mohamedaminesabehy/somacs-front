/**
 * AddClientMachineModal — Modal Premium avec Wizard 4 étapes pour Machine Client.
 *
 * Utilisée dans CreateIntervention pour ajouter une Machine à un Client.
 * Réutilise exactement le même Wizard 4 étapes que Gestion Machines.
 *
 * Props :
 * - isOpen: boolean
 * - onClose: () => void
 * - preselectedClient: Client object (prérempli et verrouillé)
 * - onMachineCreated: (machine) => void (Callback après création réussie)
 */
import { useEffect, useState } from 'react'
import { Cpu, X } from 'lucide-react'
import MachineClientWizard from './MachineClientWizard'

function Overlay({ onClick }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-fade-in"
      onClick={onClick}
      aria-hidden="true"
    />
  )
}

export default function AddClientMachineModal({ isOpen, onClose, preselectedClient, onMachineCreated }) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
    } else {
      // Délai pour permettre l'animation de fermeture
      const timer = setTimeout(() => setShouldRender(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!shouldRender) return null

  const handleSuccess = (machine) => {
    onMachineCreated(machine)
    onClose()
  }

  return (
    <>
      <Overlay onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className={`relative w-full max-w-4xl my-8 ${isOpen ? 'animate-scale-in' : ''}`}>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-modal">
            {/* Header */}
            <header className="flex items-center justify-between gap-3 border-b border-line bg-navy px-5 py-4 text-white">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/20">
                  <Cpu size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg font-bold">Ajouter une machine client</h2>
                  {preselectedClient && (
                    <p className="truncate text-sm text-brand-100">{preselectedClient.name}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Fermer"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            {/* Body - Wizard complet 4 étapes */}
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-5">
              <MachineClientWizard
                preselectedClient={preselectedClient}
                lockClient={true}
                onSuccess={handleSuccess}
                onCancel={onClose}
                isModal={true}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
