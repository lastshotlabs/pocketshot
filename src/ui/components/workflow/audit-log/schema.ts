import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const AuditLogSchema = z.object({
  id: z.string().optional(),
  data: z.union([z.string(), FromRefSchema]),
  maxItems: z.number().int().positive().optional(),
  groupByDate: z.boolean().default(true),
  showActor: z.boolean().default(true),
  onItemPress: ActionSchema.optional(),
  emptyMessage: z.string().default('No activity yet'),
  testID: z.string().optional(),
})
