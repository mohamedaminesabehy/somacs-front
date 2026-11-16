import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Error Boundary global pour capturer les erreurs de rendu React.
 * Sans ce composant, toute exception non gérée dans un arbre de composants
 * vide la page entière (page blanche) sans aucun message utilisateur.
 *
 * Usage :
 *   <ErrorBoundary>
 *     <MonComposant />
 *   </ErrorBoundary>
 *
 * @param {string} [props.fallback] - Message personnalisé affiché en cas d'erreur.
 * @param {boolean} [props.inline]  - Si true, affiche un bandeau compact plutôt qu'une plein écran.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
    this.handleReset = this.handleReset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log en dev pour faciliter le débogage
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Rendu interrompu :', error, info?.componentStack)
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const message = this.props.fallback || 'Une erreur inattendue s\'est produite sur cette page.'
    const isInline = this.props.inline === true

    if (isInline) {
      return (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span className="flex-1">{message}</span>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold underline hover:no-underline"
          >
            <RefreshCw size={12} aria-hidden="true" /> Réessayer
          </button>
        </div>
      )
    }

    return (
      <div role="alert" className="flex min-h-[320px] flex-col items-center justify-center gap-5 px-6 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
          <AlertTriangle size={24} aria-hidden="true" />
        </span>
        <div className="max-w-sm">
          <p className="font-display text-base font-bold text-ink">Erreur d&apos;affichage</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{message}</p>
        </div>
        <button
          type="button"
          onClick={this.handleReset}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink ring-1 ring-inset ring-line transition hover:bg-canvas"
        >
          <RefreshCw size={15} aria-hidden="true" /> Recharger la section
        </button>
      </div>
    )
  }
}

export default ErrorBoundary
