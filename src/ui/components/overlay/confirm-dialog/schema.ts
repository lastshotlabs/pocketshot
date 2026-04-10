import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const ConfirmDialogSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  confirmLabel: z.string().optional().default('Confirm'),
  cancelLabel: z.string().optional().default('Cancel'),
  variant: z.enum(['default', 'destructive']).optional().default('default'),
  onConfirm: ActionSchema,
  onCancel: ActionSchema.optional(),
  testID: z.string().optional(),
})
