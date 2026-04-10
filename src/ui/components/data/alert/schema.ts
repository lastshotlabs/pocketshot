import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const AlertSchema = z.object({
  id: z.string().optional(),
  variant: z
    .enum(['default', 'success', 'warning', 'error', 'info'])
    .optional()
    .default('default'),
  title: z.string(),
  body: z.string().optional(),
  icon: z.string().optional(),
  dismissible: z.boolean().optional().default(false),
  onDismiss: ActionSchema.optional(),
  action: z
    .object({
      label: z.string(),
      onPress: ActionSchema,
    })
    .optional(),
  testID: z.string().optional(),
})
