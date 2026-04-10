import type { z } from 'zod'
import type { CommentSectionSchema } from './schema'

export type CommentSectionConfig = z.infer<typeof CommentSectionSchema>

export interface CommentAuthor {
  name: string
  avatar?: string
}

export interface Comment {
  id: string
  author: CommentAuthor
  content: string
  timestamp: string
  likes: number
  liked?: boolean
  parentId?: string
  replies?: Comment[]
}
