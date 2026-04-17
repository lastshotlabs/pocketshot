import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
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
  slots: slotsSchema([
    'root',
    'backdrop',
    'panel',
    'item',
    'itemIcon',
    'itemLabel',
    'separator',
  ]).optional(),
})
