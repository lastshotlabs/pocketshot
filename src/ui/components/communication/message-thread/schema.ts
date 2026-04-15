import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const MessageThreadSchema = extendComponentSchema({
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
