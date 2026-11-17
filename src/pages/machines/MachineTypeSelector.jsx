/**
 * MachineTypeSelector — Page de sélection du type de machine avant création.
 * Réutilise exactement la charte Bleu Premium SOMACS (mêmes patterns que AssignMission StepType).
 */
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, Building2, Check, ChevronLeft, Cpu, Settings, User, Wrench,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'

const TYPES = [
  {
    value: 'SOMACS',
    icon: Settings,
    badge: 'Parc interne',
    title: 'Machine / Matériel SOMACS',
    description:
      "Équipement géré directement par SOMACS : stock, showroom, outils d'atelier ou matériel mis à disposition. Suivi complet avec réception, contrôle avant livraison et emplacement interne.",
    examples: ['Compresseur en stock', 'Matériel de démonstration', 'Outillage atelier', 'Groupe électrogène'],
    flow: ['Origine & fournisseur', 'Identification', 'Contrôle', 'Médias'],
    tone: 'navy',
  },
  {
    value: 'CLIENT',
    icon: Cpu,
    badge: 'Propriété client',
    title: 'Machine Client',
    description:
      "Équipement appartenant à un client, sur lequel SOMACS réalise des interventions. La machine reste toujours propriété du client, que la réparation soit réalisée sur site ou dans l'atelier SOMACS.",
    examples: ['Intervention sur site client', 'Prise en charge en atelier', 'Maintenance régulière', 'Garantie constructeur'],
    flow: ['Client propriétaire', 'Identification', 'Localisation', 'Médias'],
    tone: 'brand',
  },
]

export default function MachineTypeSelector() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefillClientId = searchParams.get('clientId') || ''
  const prefillClientName = searchParams.get('clientName') || ''

  const [selected, setSelected] = useState('')

  const handleContinue = () => {
    if (!selected) return
    if (selected === 'SOMACS') {
      navigate('/machines/create/somacs')
    } else {
      const params = new URLSearchParams()
      if (prefillClientId) params.set('clientId', prefillClientId)
      if (prefillClientName) params.set('clientName', prefillClientName)
      navigate(`/machines/create/client${params.size ? `?${params}` : ''}`)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/machines')}
            className="ui-btn-ghost size-10 shrink-0 px-0"
            aria-label="Retour au parc machines"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-ink-muted">Parc machines · Nouvelle fiche</p>
            <h1 className="font-display text-lg font-bold text-ink sm:text-xl">Ajouter une machine</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          eyebrow="Étape 1 · Type de machine"
          title="Quelle machine souhaitez-vous enregistrer ?"
          description="Le type détermine les informations demandées et le lien avec vos clients."
        />

        <div
          role="radiogroup"
          aria-label="Type de machine"
          className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {TYPES.map((type) => {
            const active = selected === type.value
            const Icon = type.icon
            return (
              <button
                key={type.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(type.value)}
                className={[
                  'relative flex flex-col gap-5 rounded-2xl border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:p-6',
                  active
                    ? 'border-brand-600 bg-brand-50/50 shadow-lift'
                    : 'border-line bg-white hover:border-brand-200 hover:shadow-card',
                ].join(' ')}
              >
                {active && (
                  <span
                    className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-brand-600 text-white"
                    aria-hidden="true"
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}

                {/* Header */}
                <div className="flex items-start gap-4 pr-8">
                  <span
                    className={[
                      'flex size-14 shrink-0 items-center justify-center rounded-2xl text-white',
                      active ? 'bg-brand-600' : 'bg-navy',
                    ].join(' ')}
                  >
                    <Icon size={26} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <span className={[
                      'mb-1 inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide',
                      active ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-ink-muted',
                    ].join(' ')}>
                      {type.badge}
                    </span>
                    <span className="block font-display text-lg font-bold text-ink leading-snug">
                      {type.title}
                    </span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-ink-muted text-pretty">
                      {type.description}
                    </span>
                  </div>
                </div>

                {/* Flow */}
                <ol
                  className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white/70 px-3 py-2.5"
                  aria-label="Étapes"
                >
                  {type.flow.map((label, i) => (
                    <li key={label} className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                      {i > 0 && (
                        <ArrowRight size={12} className="text-ink-faint" aria-hidden="true" />
                      )}
                      <span
                        className={[
                          'flex size-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums',
                          active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-muted',
                        ].join(' ')}
                      >
                        {i + 1}
                      </span>
                      {label}
                    </li>
                  ))}
                </ol>

                {/* Examples */}
                <div className="flex flex-wrap gap-1.5">
                  {type.examples.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-ink-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* Error hint */}
        {!selected && (
          <p className="mt-4 text-sm text-ink-faint text-center">
            Sélectionnez un type pour continuer.
          </p>
        )}

        {/* CTA */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/machines')}
            className="ui-btn-secondary"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selected}
            className="ui-btn-primary"
          >
            Continuer
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Aide contextuelle Machine Client + prefill */}
        {prefillClientName && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
            <User size={15} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
            <p className="text-sm text-brand-800">
              Vous ajoutez une machine pour le client{' '}
              <span className="font-semibold">{prefillClientName}</span>.
              Sélectionnez <strong>Machine Client</strong> pour continuer avec ce client pré-sélectionné.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
