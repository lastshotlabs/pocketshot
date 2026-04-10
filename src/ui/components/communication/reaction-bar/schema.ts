import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

const ReactionItemSchema = z.object({
  emoji: z.string(),
  label: z.string(),
  count: z.number(),
  reacted: z.boolean().optional().default(false),
})

export const ReactionBarSchema = z.object({
  id: z.string().optional(),
  reactions: z.union([z.array(ReactionItemSchema), FromRefSchema]),
  onReactAction: ActionSchema.optional(),
  maxDisplay: z.number().int().min(1).default(8),
  testID: z.string().optional(),
})
