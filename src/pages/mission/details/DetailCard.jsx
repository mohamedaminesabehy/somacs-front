export function DetailCard({ icon, title, action, children, className = '', bodyClassName = 'p-4 sm:p-5' }) {
  const Icon = icon
  return (
    <section className={`ui-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
              <Icon size={16} aria-hidden="true" />
            </span>
          )}
          <h2 className="truncate font-display text-[15px] font-bold tracking-tight text-ink">{title}</h2>
        </div>
        {action}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

export function Field({ label, children, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-relaxed text-ink">
        {children || <span className="font-medium text-ink-faint">Non renseigné</span>}
      </dd>
    </div>
  )
}
