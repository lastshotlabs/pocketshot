import type { z } from 'zod'
import type { ChatWindowSchema } from './schema'

export type ChatWindowConfig = z.input<typeof ChatWindowSchema>

export interface ChatMessage {
  id: string
  content: string
  senderId: string
  senderName?: string
  senderAvatarUrl?: string
  createdAt: string
  reactions?: { emoji: string; count: number; reacted?: boolean }[]
  replyTo?: { id: string; content: string; senderName?: string }
  readBy?: string[]
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
}
