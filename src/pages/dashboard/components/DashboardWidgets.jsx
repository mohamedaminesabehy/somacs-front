import { ArrowUpRight } from 'lucide-react'

export function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`flex flex-col rounded-2xl border border-line bg-white shadow-card ${className}`}>
      <header className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <h2 className="font-display text-[15px] font-bold text-ink text-balance">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">{children}</div>
    </section>
  )
}

const KPI_TONES = {
  brand: { icon: 'bg-brand-600 text-white', bar: 'bg-brand-600' },
  amber: { icon: 'bg-amber-500 text-white', bar: 'bg-amber-500' },
  red: { icon: 'bg-red-600 text-white', bar: 'bg-red-600' },
  teal: { icon: 'bg-teal-600 text-white', bar: 'bg-teal-600' },
}

export function KpiTile({ label, value, detail, icon: Icon, tone = 'brand', ratio, isLoading, onClick }) {
  const palette = KPI_TONES[tone] || KPI_TONES.brand
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="group flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline-none focus-visible:shadow-focus"
    >
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${palette.icon}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
        {onClick && <ArrowUpRight size={16} className="text-ink-faint transition group-hover:text-brand-600" aria-hidden="true" />}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
        {isLoading ? (
          <div className="mt-2 h-8 w-16 rounded-md ui-skeleton" />
        ) : (
          <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-ink">{value}</p>
        )}
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{detail}</p>
      </div>
      {typeof ratio === 'number' && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas" aria-hidden="true">
          <div className={`h-full rounded-full ${palette.bar} transition-all duration-700`} style={{ width: `${Math.min(Math.max(ratio, 0), 100)}%` }} />
        </div>
      )}
    </Tag>
  )
}

export function SegmentedBar({ rows, total }) {
  if (!total) return <div className="h-3 w-full rounded-full bg-canvas" aria-hidden="true" />
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-canvas" role="img" aria-label={rows.map((r) => `${r.label} ${r.count}`).join(', ')}>
      {rows.filter((r) => r.count > 0).map((row) => (
        <div key={row.key} className={`${row.tone} h-full transition-all duration-700`} style={{ width: `${(row.count / total) * 100}%` }} />
      ))}
    </div>
  )
}

export function Donut({ rows, total, centerLabel }) {
  let cursor = 0
  const stops = total
    ? rows.filter((r) => r.count > 0).map((row) => {
        const start = cursor
        cursor += (row.count / total) * 360
        return `${row.hex} ${start}deg ${cursor}deg`
      })
    : ['#E3E8F0 0deg 360deg']
  return (
    <div className="relative mx-auto h-36 w-36 shrink-0" role="img" aria-label={rows.map((r) => `${r.label} ${r.count}`).join(', ')}>
      <div className="h-full w-full rounded-full" style={{ background: `conic-gradient(${stops.join(', ')})` }} />
      <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white">
        <span className="font-display text-2xl font-extrabold tabular-nums text-ink">{total}</span>
        <span className="text-[11px] font-medium text-ink-muted">{centerLabel}</span>
      </div>
    </div>
  )
}

export function Legend({ rows }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 text-ink-soft">
            <span className={`h-2.5 w-2.5 rounded-sm ${row.tone}`} aria-hidden="true" />
            {row.label}
          </span>
          <span className="font-semibold tabular-nums text-ink">{row.count}</span>
        </li>
      ))}
    </ul>
  )
}

export function RankBars({ items }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ol className="flex flex-col gap-3.5">
      {items.map((item, index) => (
        <li key={item.key} className="flex items-center gap-3">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${index === 0 ? 'bg-brand-600 text-white' : 'bg-canvas text-ink-muted'}`}>
            {index + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium text-ink-soft">{item.label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-ink">{item.value}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas" aria-hidden="true">
              <div className={`h-full rounded-full ${index === 0 ? 'bg-brand-600' : 'bg-brand-300'}`} style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
