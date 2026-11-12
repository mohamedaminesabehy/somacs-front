export function Card({ as: Tag = 'section', className = '', children, ...props }) {
  return (
    <Tag className={`ui-card overflow-hidden ${className}`} {...props}>
      {children}
    </Tag>
  )
}

export function CardHeader({ title, subtitle, icon, actions, className = '' }) {
  const Icon = icon
  return (
    <header className={`ui-card-header ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
            <Icon size={17} aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="ui-card-title truncate">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-muted truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}

export function CardBody({ className = '', children }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>
}
