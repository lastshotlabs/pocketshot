import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const NotificationBellSchema = z.object({
  id: z.string().optional(),
  count: z.union([z.number().int().min(0), FromRefSchema]).optional(),
  maxCount: z.number().int().min(1).default(99),
  onPress: ActionSchema.optional(),
  animated: z.boolean().default(true),
  testID: z.string().optional(),
})
