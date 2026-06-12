/**
 * Central constants for the Devis-Suivi CRM module.
 * Single source of truth — import from here everywhere.
 */

// ─── Status ──────────────────────────────────────────────────────────────────

export const DEVIS_STATUS = {
  CREATED: 'CREATED',
  SENT: 'SENT',
  CONTACTED: 'CONTACTED',
  WAITING: 'WAITING',
  NEGOTIATION: 'NEGOTIATION',
  HOT_LEAD: 'HOT_LEAD',
  COLD_LEAD: 'COLD_LEAD',
  NO_RESPONSE: 'NO_RESPONSE',
  ACCEPTED: 'ACCEPTED',
  PURCHASED: 'PURCHASED',
  REFUSED: 'REFUSED',
  EXPIRED: 'EXPIRED',
}

export const TERMINAL_STATUSES = [
  DEVIS_STATUS.PURCHASED,
  DEVIS_STATUS.REFUSED,
  DEVIS_STATUS.EXPIRED,
]

export const PIPELINE_STATUSES = [
  DEVIS_STATUS.CREATED,
  DEVIS_STATUS.SENT,
  DEVIS_STATUS.CONTACTED,
  DEVIS_STATUS.WAITING,
  DEVIS_STATUS.NEGOTIATION,
  DEVIS_STATUS.HOT_LEAD,
  DEVIS_STATUS.COLD_LEAD,
  DEVIS_STATUS.NO_RESPONSE,
  DEVIS_STATUS.ACCEPTED,
]

/**
 * Status metadata: label, badge colors (Tailwind), icon name, funnel order
 */
export const STATUS_META = {
  [DEVIS_STATUS.CREATED]: {
    label: 'Créé',
    tone: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    gradient: 'from-slate-50 to-slate-100',
    order: 0,
  },
  [DEVIS_STATUS.SENT]: {
    label: 'Envoyé',
    tone: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-400',
    gradient: 'from-sky-50 to-sky-100',
    order: 1,
  },
  [DEVIS_STATUS.CONTACTED]: {
    label: 'Contacté',
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    gradient: 'from-blue-50 to-blue-100',
    order: 2,
  },
  [DEVIS_STATUS.WAITING]: {
    label: 'En attente',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
    gradient: 'from-amber-50 to-amber-100',
    order: 3,
  },
  [DEVIS_STATUS.NEGOTIATION]: {
    label: 'En négociation',
    tone: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
    gradient: 'from-violet-50 to-violet-100',
    order: 4,
  },
  [DEVIS_STATUS.HOT_LEAD]: {
    label: 'Prospect chaud',
    tone: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    gradient: 'from-orange-50 to-orange-100',
    order: 5,
  },
  [DEVIS_STATUS.COLD_LEAD]: {
    label: 'Prospect froid',
    tone: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    dot: 'bg-cyan-400',
    gradient: 'from-cyan-50 to-cyan-100',
    order: 6,
  },
  [DEVIS_STATUS.NO_RESPONSE]: {
    label: 'Sans réponse',
    tone: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    dot: 'bg-zinc-400',
    gradient: 'from-zinc-50 to-zinc-100',
    order: 7,
  },
  [DEVIS_STATUS.ACCEPTED]: {
    label: "Client d'accord",
    tone: 'bg-teal-50 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
    gradient: 'from-teal-50 to-teal-100',
    order: 8,
  },
  [DEVIS_STATUS.PURCHASED]: {
    label: 'Acheté',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-50 to-emerald-100',
    order: 9,
  },
  [DEVIS_STATUS.REFUSED]: {
    label: 'Refusé',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    gradient: 'from-rose-50 to-rose-100',
    order: 10,
  },
  [DEVIS_STATUS.EXPIRED]: {
    label: 'Expiré',
    tone: 'bg-gray-100 text-gray-500 border-gray-200',
    dot: 'bg-gray-400',
    gradient: 'from-gray-50 to-gray-100',
    order: 11,
  },
}

export const STATUS_OPTIONS_ALL = ['ALL', ...Object.values(DEVIS_STATUS)]

/**
 * Hex colors per status — single source of truth for charts (donut, etc.).
 * Every status has a dedicated color: no fallback collisions.
 */
export const STATUS_HEX_COLORS = {
  [DEVIS_STATUS.CREATED]: '#94a3b8',     // slate
  [DEVIS_STATUS.SENT]: '#60a5fa',        // sky/blue
  [DEVIS_STATUS.CONTACTED]: '#3b82f6',   // blue
  [DEVIS_STATUS.WAITING]: '#fbbf24',     // amber
  [DEVIS_STATUS.NEGOTIATION]: '#8b5cf6', // violet
  [DEVIS_STATUS.HOT_LEAD]: '#f97316',    // orange
  [DEVIS_STATUS.COLD_LEAD]: '#22d3ee',   // cyan
  [DEVIS_STATUS.NO_RESPONSE]: '#a1a1aa', // zinc
  [DEVIS_STATUS.ACCEPTED]: '#14b8a6',    // teal
  [DEVIS_STATUS.PURCHASED]: '#10b981',   // emerald
  [DEVIS_STATUS.REFUSED]: '#f43f5e',     // rose
  [DEVIS_STATUS.EXPIRED]: '#6b7280',     // gray
}

/**
 * Business categories — single source of truth.
 *   Validés      = PURCHASED uniquement
 *   Non validés  = REFUSED + EXPIRED
 *   En attente   = tous les statuts du pipeline (dont ACCEPTED : accord client,
 *                  mais achat non encore confirmé → reste "en attente").
 */
export const VALIDATED_STATUSES = [DEVIS_STATUS.PURCHASED]
export const NON_VALIDATED_STATUSES = [DEVIS_STATUS.REFUSED, DEVIS_STATUS.EXPIRED]
export const PENDING_STATUSES = PIPELINE_STATUSES

// ─── Reminder Priority ────────────────────────────────────────────────────────

export const REMINDER_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
}

export const PRIORITY_META = {
  [REMINDER_PRIORITY.LOW]: {
    label: 'Faible',
    tone: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    order: 0,
  },
  [REMINDER_PRIORITY.MEDIUM]: {
    label: 'Moyen',
    tone: 'bg-blue-50 text-blue-600 border-blue-200',
    dot: 'bg-blue-400',
    order: 1,
  },
  [REMINDER_PRIORITY.HIGH]: {
    label: 'Élevé',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    order: 2,
  },
  [REMINDER_PRIORITY.URGENT]: {
    label: 'Urgent',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    order: 3,
  },
}

// ─── Refusal Reason Codes ─────────────────────────────────────────────────────

export const REFUSAL_REASON_CODE = {
  PRICE_TOO_HIGH: 'PRICE_TOO_HIGH',
  COMPETITOR_CHEAPER: 'COMPETITOR_CHEAPER',
  NO_BUDGET: 'NO_BUDGET',
  NOT_INTERESTED: 'NOT_INTERESTED',
  PROJECT_CANCELLED: 'PROJECT_CANCELLED',
  LATE_RESPONSE: 'LATE_RESPONSE',
  MISSING_FEATURES: 'MISSING_FEATURES',
  OTHER: 'OTHER',
}

export const REFUSAL_REASON_META = {
  [REFUSAL_REASON_CODE.PRICE_TOO_HIGH]: {
    label: 'Prix trop élevé',
    emoji: '💰',
    color: 'text-rose-600',
  },
  [REFUSAL_REASON_CODE.COMPETITOR_CHEAPER]: {
    label: 'Concurrent moins cher',
    emoji: '⚔️',
    color: 'text-orange-600',
  },
  [REFUSAL_REASON_CODE.NO_BUDGET]: {
    label: 'Pas de budget',
    emoji: '🚫',
    color: 'text-amber-600',
  },
  [REFUSAL_REASON_CODE.NOT_INTERESTED]: {
    label: 'Pas intéressé',
    emoji: '👋',
    color: 'text-slate-600',
  },
  [REFUSAL_REASON_CODE.PROJECT_CANCELLED]: {
    label: 'Projet annulé',
    emoji: '❌',
    color: 'text-zinc-600',
  },
  [REFUSAL_REASON_CODE.LATE_RESPONSE]: {
    label: 'Réponse trop tardive',
    emoji: '⏰',
    color: 'text-violet-600',
  },
  [REFUSAL_REASON_CODE.MISSING_FEATURES]: {
    label: 'Fonctionnalités manquantes',
    emoji: '🔧',
    color: 'text-blue-600',
  },
  [REFUSAL_REASON_CODE.OTHER]: {
    label: 'Autre',
    emoji: '📝',
    color: 'text-gray-600',
  },
}

// ─── Auto-reminder offsets (days) ─────────────────────────────────────────────

export const AUTO_REMINDER_DAYS = {
  [DEVIS_STATUS.CONTACTED]: 3,
  [DEVIS_STATUS.WAITING]: 7,
  [DEVIS_STATUS.NEGOTIATION]: 2,
  [DEVIS_STATUS.HOT_LEAD]: 1,
  [DEVIS_STATUS.NO_RESPONSE]: 5,
}

// ─── Funnel ordered statuses ──────────────────────────────────────────────────

export const FUNNEL_STATUSES = [
  DEVIS_STATUS.CREATED,
  DEVIS_STATUS.SENT,
  DEVIS_STATUS.CONTACTED,
  DEVIS_STATUS.NEGOTIATION,
  DEVIS_STATUS.ACCEPTED,
  DEVIS_STATUS.PURCHASED,
]

// ─── Timeline event icons (action → icon config) ──────────────────────────────

export const TIMELINE_ACTION_META = {
  CREATE_DEVIS_SUIVI: {
    label: 'Suivi créé',
    icon: '📄',
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
  },
  UPDATE_DEVIS_SUIVI: {
    label: 'Modification',
    icon: '✏️',
    color: 'bg-gradient-to-br from-slate-400 to-slate-500',
    lightColor: 'bg-slate-50',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
  },
  MARK_DEVIS_PURCHASED: {
    label: 'Devis acheté',
    icon: '✅',
    color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
  },
  MARK_DEVIS_LOST: {
    label: 'Devis perdu',
    icon: '❌',
    color: 'bg-gradient-to-br from-rose-500 to-rose-600',
    lightColor: 'bg-rose-50',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-200',
  },
  RELANCE_DEVIS: {
    label: 'Relance programmée',
    icon: '🔄',
    color: 'bg-gradient-to-br from-amber-500 to-amber-600',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-200',
  },
  CHANGE_STATUS_DEVIS_SUIVI: {
    label: 'Changement de statut',
    icon: '📊',
    color: 'bg-gradient-to-br from-violet-500 to-violet-600',
    lightColor: 'bg-violet-50',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-200',
  },
}

// ─── Chart colors ─────────────────────────────────────────────────────────────

export const CHART_COLORS = [
  '#0052CC', '#00B8D9', '#36B37E', '#FF5630', '#FF8B00',
  '#6554C0', '#00875A', '#DE350B', '#0065FF', '#57D9A3',
]
