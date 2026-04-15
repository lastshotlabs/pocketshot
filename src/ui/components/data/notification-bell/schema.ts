import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const NotificationBellSchema = extendComponentSchema({
  id: z.string().optional(),
  count: z.union([z.number().int().min(0), FromRefSchema]).optional(),
  maxCount: z.number().int().min(1).default(99),
  slots: slotsSchema(['root', 'button', 'badge']).optional(),
  onPress: ActionSchema.optional(),
  animated: z.boolean().default(true),
  testID: z.string().optional(),
})
