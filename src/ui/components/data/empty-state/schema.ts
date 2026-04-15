import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const EmptyStateSchema = extendComponentSchema({
  id: z.string().optional(),
  title: z.string().default('Nothing here yet'),
  description: z.string().optional(),
  icon: z.string().optional(),
  action: z
    .object({
      label: z.string(),
      onPress: ActionSchema,
    })
    .optional(),
  slots: slotsSchema(['root', 'icon', 'title', 'description', 'action']).optional(),
  testID: z.string().optional(),
})
