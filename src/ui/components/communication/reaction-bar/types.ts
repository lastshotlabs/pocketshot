import type { z } from 'zod'
import type { ReactionBarSchema } from './schema'

export type ReactionBarConfig = z.infer<typeof ReactionBarSchema>

export interface ReactionItem {
  emoji: string
  label: string
  count: number
  reacted: boolean
}
