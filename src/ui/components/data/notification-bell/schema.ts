
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const NotificationBellSchema = extendComponentSchema({
  id: z.string().optional(),
  count: z.union([z.number().int().min(0), FromRefSchema]).optional(),
  maxCount: z.number().int().min(1).default(99),
  onPress: ActionSchema.optional(),
  animated: z.boolean().default(true),
  testID: z.string().optional(),
})

