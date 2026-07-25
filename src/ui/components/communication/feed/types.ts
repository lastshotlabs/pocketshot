import type { z } from 'zod'
import type { FeedSchema } from './schema'

export type FeedConfig = z.input<typeof FeedSchema>

export interface FeedItem {
  id: string
  title?: string
  body?: string
  author?: {
    name: string
    avatarUrl?: string
  }
  createdAt?: string
  imageUrl?: string
  tags?: string[]
  likes?: number
  comments?: number
}
