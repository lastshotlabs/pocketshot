import { z } from 'zod'
import type { Action } from '../../../actions/types'
const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

void FromRefSchema

export const DropdownMenuSchema = z.object({
  id: z.string().optional(),
  trigger: z.object({
    label: z.string(),
    icon: z.string().optional(),
  }),
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      icon: z.string().optional(),
      onPress: ActionSchema,
      destructive: z.boolean().optional().default(false),
      disabled: z.boolean().optional().default(false),
    }),
  ),
  align: z.enum(['start', 'end']).optional().default('start'),
  testID: z.string().optional(),
})
