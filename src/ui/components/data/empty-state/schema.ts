import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const EmptyStateSchema = z.object({
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
  testID: z.string().optional(),
})
