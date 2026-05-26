import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

// ─── Utilitaires de regroupement chronologique ──────────────────────────────

const getDateGroup = (date) => {
  if (!date) return 'Sans date'
  const eventDate = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const isToday = eventDate.toDateString() === today.toDateString()
  const isYesterday = eventDate.toDateString() === yesterday.toDateString()
  
  if (isToday) return 'today'
  if (isYesterday) return 'yesterday'
  
  const daysAgo = Math.floor((today - eventDate) / (1000 * 60 * 60 * 24))
  if (daysAgo < 7) return 'thisWeek'
  if (daysAgo < 30) return 'thisMonth'
  return 'older'
}

const getDateGroupLabel = (group) => {
  const labels = {
    today: 'Aujourd\'hui',
    yesterday: 'Hier',
    thisWeek: 'Cette semaine',
    thisMonth: 'Ce mois-ci',
    older: 'Ancien'
  }
  return labels[group] || group
}

const groupLogsByDate = (logs) => {
  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: []
  }
  
  logs.forEach(log => {
    const group = getDateGroup(log.createdAt)
    if (groups[group]) groups[group].push(log)
  })
  
  return groups
}

// ─── Composant : Timeline Empty State ──────────────────────────────────────

export function TimelineEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-4 border border-slate-200">
        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-black text-slate-900 mb-1">Aucune activité commerciale</h3>
      <p className="text-sm font-medium text-slate-500 text-center max-w-xs mb-4">
        Les interactions avec ce devis apparaîtront ici au fur et à mesure de votre pilotage.
      </p>
      <div className="w-1 h-12 bg-gradient-to-b from-slate-200 to-transparent rounded-full"></div>
    </div>
  )
}

// ─── Composant : Timeline Group Header ─────────────────────────────────────

export function TimelineGroupHeader({ label }) {
  return (
    <div className="flex items-center gap-3 my-6 first:mt-0">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
      <span className="px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-500 bg-gradient-to-r from-slate-50 to-slate-50 rounded-full whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
    </div>
  )
}

// ─── Composant : Timeline Event Card ───────────────────────────────────────

export function TimelineEventCard({ log, actionMeta, statusMeta, index, total }) {
  const isLast = index === total - 1
  const showConnector = !isLast
  
  return (
    <div className="relative pl-8">
      {/* Vertical connector line */}
      {showConnector && (
        <div className="absolute left-3 top-10 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-100"></div>
      )}
      
      {/* Timeline node */}
      <div className="absolute left-0 top-1.5 -translate-x-1/2">
        <div className={`relative w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg ${actionMeta?.color || 'bg-slate-400'}`}>
          {/* Gradient background */}
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity bg-white"></div>
          
          {/* Glow effect */}
          <div className={`absolute inset-0 rounded-full opacity-20 blur-md ${actionMeta?.color || 'bg-slate-400'}`}></div>
          
          {/* Icon or initial */}
          <span className="relative z-10">{actionMeta?.icon || actionMeta?.label?.charAt(0)}</span>
        </div>
      </div>

      {/* Event content card */}
      <div className="group bg-white rounded-2xl border border-slate-200 p-4 mb-4 transition-all duration-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h4 className="font-bold text-slate-900 text-sm group-hover:text-slate-950">
              {actionMeta?.label || log.action}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(log.createdAt).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          
          {log.userName && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${actionMeta?.lightColor || 'bg-slate-50'} ${actionMeta?.textColor || 'text-slate-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${actionMeta?.color || 'bg-slate-400'}`}></span>
              {log.userName}
            </span>
          )}
        </div>

        {/* Description */}
        {log.description && (
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            {log.description}
          </p>
        )}

        {/* Status transition */}
        {log.oldData?.status && log.newData?.status && log.oldData.status !== log.newData.status && (
          <div className="flex items-center gap-2 text-xs my-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className={`px-2 py-1 rounded-full font-bold border ${statusMeta[log.oldData.status]?.tone || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {statusMeta[log.oldData.status]?.label || log.oldData.status}
            </span>
            <span className="text-slate-400">→</span>
            <span className={`px-2 py-1 rounded-full font-bold border ${statusMeta[log.newData.status]?.tone || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {statusMeta[log.newData.status]?.label || log.newData.status}
            </span>
          </div>
        )}

        {/* Metadata footer */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100">
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          {new Date(log.createdAt).toLocaleDateString('fr-FR', { 
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Composant : Timeline Container Premium ────────────────────────────────

export function TimelineContainer({ logs, loading, actionMeta, statusMeta, maxVisible = 4 }) {
  const [expanded, setExpanded] = React.useState(false)
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-400">Chargement de l'historique...</p>
        </div>
      </div>
    )
  }
  
  if (!logs || logs.length === 0) {
    return <TimelineEmptyState />
  }

  // Grouper par date
  const grouped = groupLogsByDate(logs)
  const visibleLogs = expanded ? logs : logs.slice(0, maxVisible)
  const hasMore = logs.length > maxVisible

  // Reconstruire les groupes basé sur logs visibles
  const visibleGrouped = {}
  visibleLogs.forEach(log => {
    const group = getDateGroup(log.createdAt)
    if (!visibleGrouped[group]) visibleGrouped[group] = []
    visibleGrouped[group].push(log)
  })

  const groupOrder = ['today', 'yesterday', 'thisWeek', 'thisMonth', 'older']

  return (
    <div className="space-y-0">
      {/* Timeline items */}
      {groupOrder.map(groupKey => {
        const groupLogs = visibleGrouped[groupKey]
        if (!groupLogs || groupLogs.length === 0) return null

        return (
          <div key={groupKey}>
            <TimelineGroupHeader label={getDateGroupLabel(groupKey)} />
            <div className="space-y-0">
              {groupLogs.map((log, idx) => (
                <TimelineEventCard
                  key={log.id}
                  log={log}
                  actionMeta={actionMeta[log.action]}
                  statusMeta={statusMeta}
                  index={idx}
                  total={groupLogs.length}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Expand button */}
      {hasMore && (
        <div className="flex justify-center mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-sm font-bold text-slate-700 transition-all hover:shadow-md active:scale-95"
          >
            {expanded ? (
              <>
                <ChevronUp size={16} />
                Réduire l'historique
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Voir {logs.length - maxVisible} événements de plus
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Composant : Premium Timeline Wrapper ─────────────────────────────────

export function PremiumAuditTimeline({ suiviId, actionMeta, statusMeta, loading, logs }) {
  return (
    <div className="space-y-0">
      <TimelineContainer
        logs={logs}
        loading={loading}
        actionMeta={actionMeta}
        statusMeta={statusMeta}
        maxVisible={4}
      />
    </div>
  )
}
