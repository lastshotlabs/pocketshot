import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const FeedSchema = z.object({
  id: z.string().optional(),
  data: z.union([z.string(), FromRefSchema]),
  refreshable: z.boolean().default(true),
  onItemPress: ActionSchema.optional(),
  onEndReached: ActionSchema.optional(),
  emptyMessage: z.string().default('Nothing here yet'),
  loadingCount: z.number().int().min(1).default(4),
  showAvatars: z.boolean().default(true),
  testID: z.string().optional(),
})
