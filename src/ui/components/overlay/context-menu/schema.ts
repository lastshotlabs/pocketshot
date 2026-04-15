import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const ContextMenuSchema = extendComponentSchema({
  id: z.string().optional(),
  triggerLabel: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      icon: z.string().optional(),
      destructive: z.boolean().optional().default(false),
      disabled: z.boolean().optional().default(false),
      onPress: ActionSchema,
    }),
  ),
  testID: z.string().optional(),
})


