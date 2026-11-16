import { CalendarRange, LayoutList, ListTree, RotateCcw, Search, X } from 'lucide-react'
import { MODULE_SHORT_LABELS, OPERATIONS, PERIOD_PRESETS } from './auditConfig'

export default function ActivityFilters({
  dateStart,
  dateEnd,
  onDateStartChange,
  onDateEndChange,
  onApplyDates,
  onPreset,
  activePreset,
  onReset,
  dateError,
  search,
  onSearchChange,
  moduleFilter,
  onModuleChange,
  operationFilter,
  onOperationChange,
  modules,
  operations,
  view,
  onViewChange,
  resultCount,
  hasActiveFilters,
  onClearFilters,
}) {
  return (
    <section aria-label="Filtres du journal" className="ui-card flex flex-col">
      <form
        className="flex flex-col gap-4 border-b border-line p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-5"
        onSubmit={(event) => {
          event.preventDefault()
          onApplyDates()
        }}
      >
        <div className="flex flex-col gap-2">
          <span className="ui-label">Période rapide</span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Période rapide">
            {PERIOD_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => onPreset(preset)}
                aria-pressed={activePreset === preset.key}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activePreset === preset.key ? 'bg-navy text-white' : 'bg-canvas text-ink-muted hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:w-80 sm:shrink-0">
          <label className="flex flex-col gap-1.5">
            <span className="ui-label">Du</span>
            <input type="date" className="ui-input" value={dateStart} onChange={onDateStartChange} max={dateEnd || undefined} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="ui-label">Au</span>
            <input type="date" className="ui-input" value={dateEnd} onChange={onDateEndChange} min={dateStart || undefined} />
          </label>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="ui-btn ui-btn-primary">
            <CalendarRange size={16} aria-hidden="true" /> Appliquer
          </button>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onReset} title="Revenir au mois en cours">
            <RotateCcw size={16} aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Réinitialiser</span>
          </button>
        </div>
      </form>

      {dateError && (
        <p role="alert" className="border-b border-line bg-red-50 px-5 py-2.5 text-sm font-medium text-red-700">{dateError}</p>
      )}

      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5">
        <label className="relative min-w-0 sm:min-w-64 sm:flex-1">
          <span className="sr-only">Rechercher dans le journal</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input
            type="search"
            className="ui-input pl-9"
            placeholder="Rechercher une description, une référence…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:flex">
          <label className="flex flex-col gap-1 sm:w-48">
            <span className="sr-only">Module</span>
            <select className="ui-select" value={moduleFilter} onChange={(event) => onModuleChange(event.target.value)}>
              <option value="">Tous les modules</option>
              {modules.map((key) => (
                <option key={key} value={key}>{MODULE_SHORT_LABELS[key] || key}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 sm:w-52">
            <span className="sr-only">Opération</span>
            <select className="ui-select" value={operationFilter} onChange={(event) => onOperationChange(event.target.value)}>
              <option value="">Toutes les opérations</option>
              {operations.map((key) => (
                <option key={key} value={key}>{OPERATIONS[key].label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-end">
          <p className="whitespace-nowrap text-sm text-ink-muted" aria-live="polite">
            <span className="font-semibold tabular-nums text-ink">{resultCount}</span> résultat{resultCount > 1 ? 's' : ''}
          </p>
          {hasActiveFilters && (
            <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={onClearFilters}>
              <X size={14} aria-hidden="true" /> Effacer
            </button>
          )}
          <div className="flex rounded-lg bg-canvas p-1" role="group" aria-label="Mode d'affichage">
            {[
              { key: 'timeline', label: 'Chronologie', icon: ListTree },
              { key: 'table', label: 'Tableau', icon: LayoutList },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => onViewChange(key)}
                aria-pressed={view === key}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                  view === key ? 'bg-white text-ink shadow-card' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sr-only sm:hidden">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
