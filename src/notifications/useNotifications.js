import { createContext, useContext } from 'react'

export const NotificationsContext = createContext(null)

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    return {
      notifications: [],
      unreadCount: 0,
      refresh: async () => { /* no provider */ },
      markRead: async () => { /* no provider */ },
      markAllRead: async () => { /* no provider */ },
      enablePushNotifications: async () => ({ ok: false }),
    }
  }
  return ctx
}
