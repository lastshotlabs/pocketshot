import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const DropdownMenuSchema = extendComponentSchema({
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
  slots: slotsSchema([
    'root',
    'trigger',
    'triggerIcon',
    'triggerLabel',
    'chevron',
    'backdrop',
    'panel',
    'item',
    'itemIcon',
    'itemLabel',
    'separator',
  ]).optional(),
})
