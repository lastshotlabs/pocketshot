import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const CalendarSchema = z.object({
  id: z.string().optional(),
  value: z.union([z.string(), FromRefSchema]).optional(),
  defaultValue: z.string().optional(),
  events: z
    .union([
      z.array(
        z.object({
          date: z.string(),
          title: z.string(),
          color: z.string().optional(),
        }),
      ),
      FromRefSchema,
    ])
    .optional(),
  mode: z.enum(['single', 'range']).default('single'),
  onDatePress: ActionSchema.optional(),
  showNavigation: z.boolean().default(true),
  testID: z.string().optional(),
})
