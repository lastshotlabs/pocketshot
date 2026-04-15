import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const NotificationFeedSchema = extendComponentSchema({
  id: z.string().optional(),
  data: z.union([z.string(), FromRefSchema]),
  onItemPress: ActionSchema.optional(),
  onMarkAllRead: ActionSchema.optional(),
  refreshable: z.boolean().default(true),
  emptyMessage: z.string().default('All caught up! 🎉'),
  showMarkAllRead: z.boolean().default(true),
  testID: z.string().optional(),
})
