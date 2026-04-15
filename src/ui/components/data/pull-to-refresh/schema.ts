import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const PullToRefreshSchema = z.object({
  id: z.string().optional(),
  refreshing: z.union([z.boolean(), FromRefSchema]).optional().default(false),
  onRefresh: ActionSchema,
  color: z.string().optional(),
  testID: z.string().optional(),
})
