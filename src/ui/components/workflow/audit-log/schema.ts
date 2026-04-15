import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const AuditLogSchema = extendComponentSchema({
  id: z.string().optional(),
  data: z.union([z.string(), FromRefSchema]),
  maxItems: z.number().int().positive().optional(),
  groupByDate: z.boolean().default(true),
  showActor: z.boolean().default(true),
  onItemPress: ActionSchema.optional(),
  emptyMessage: z.string().default('No activity yet'),
  testID: z.string().optional(),
})
