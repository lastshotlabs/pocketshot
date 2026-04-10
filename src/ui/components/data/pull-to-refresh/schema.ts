import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const PullToRefreshSchema = z.object({
  id: z.string().optional(),
  refreshing: z.union([z.boolean(), FromRefSchema]).optional().default(false),
  onRefresh: ActionSchema,
  color: z.string().optional(),
  testID: z.string().optional(),
})
