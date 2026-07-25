import type { z } from 'zod'
import type { MessageThreadSchema } from './schema'

export type MessageThreadConfig = z.input<typeof MessageThreadSchema>

export interface Message {
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

export interface MessageGroup {
  messages: Message[]
  senderId: string
  isFirst: boolean
}
