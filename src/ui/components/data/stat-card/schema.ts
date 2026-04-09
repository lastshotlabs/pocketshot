import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const StatCardSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  value: z.union([z.string(), z.number(), z.object({ from: z.string() })]),
  trend: z
    .object({
      direction: z.enum(['up', 'down', 'neutral']),
      value: z.string(),
    })
    .optional(),
  icon: z.string().optional(),
  onPress: ActionSchema.optional(),
  testID: z.string().optional(),
})
