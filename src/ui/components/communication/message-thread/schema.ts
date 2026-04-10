import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const MessageThreadSchema = z.object({
  id: z.string().optional(),
  data: z.union([z.string(), FromRefSchema]),
  currentUserId: z.union([z.string(), FromRefSchema]),
  refreshable: z.boolean().default(false),
  onReplyAction: ActionSchema.optional(),
  onReactAction: ActionSchema.optional(),
  onLoadMoreAction: ActionSchema.optional(),
  showAvatars: z.boolean().default(true),
  testID: z.string().optional(),
})
