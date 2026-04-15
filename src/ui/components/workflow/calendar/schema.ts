
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const CalendarSchema = extendComponentSchema({
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

