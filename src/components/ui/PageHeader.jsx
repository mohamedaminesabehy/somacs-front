import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

/**
 * En-tête de page standard du design system.
 * - breadcrumbs : [{ label, to? }]
 * - actions : nœud React aligné à droite (s'empile sous le titre en mobile)
 */
function PageHeader({ eyebrow, title, description, icon, breadcrumbs, actions, meta, className = '' }) {
  const Icon = icon
  return (
    <header className={`flex flex-col gap-4 animate-fade-up ${className}`}>
      {breadcrumbs?.length > 0 && (
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-xs text-ink-muted min-w-0">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1 min-w-0">
              {index > 0 && <ChevronRight size={12} className="shrink-0 text-ink-faint" aria-hidden="true" />}
              {crumb.to ? (
                <Link to={crumb.to} className="truncate font-medium hover:text-brand-700 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate font-semibold text-ink-soft" aria-current="page">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-3.5 min-w-0">
          {Icon && (
            <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-white shadow-lift ui-blueprint">
              <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && <p className="ui-eyebrow text-brand-700">{eyebrow}</p>}
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink text-balance sm:text-[28px] leading-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted text-pretty">{description}</p>
            )}
            {meta && <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div>}
      </div>
    </header>
  )
}

export default memo(PageHeader)
