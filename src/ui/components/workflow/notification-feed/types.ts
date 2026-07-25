import type { z } from 'zod'
import type { NotificationFeedSchema } from './schema'

export type NotificationFeedConfig = z.input<typeof NotificationFeedSchema>

export interface Notification {
  id: string
  title: string
  body?: string
  type?: 'info' | 'success' | 'warning' | 'error' | 'mention' | 'follow' | 'like' | 'system'
  isRead: boolean
  createdAt: string
  avatarUrl?: string
  actionUrl?: string
  actor?: { name: string; avatarUrl?: string }
}

export type NotifListItem =
  | { type: 'header'; key: string; label: string }
  | { type: 'notification'; key: string; notification: Notification }
