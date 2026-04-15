import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

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
