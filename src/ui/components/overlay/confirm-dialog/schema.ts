import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const ConfirmDialogSchema = extendComponentSchema({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  confirmLabel: z.string().optional().default('Confirm'),
  cancelLabel: z.string().optional().default('Cancel'),
  variant: z.enum(['default', 'destructive']).optional().default('default'),
  onConfirm: ActionSchema,
  onCancel: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'backdrop',
    'panel',
    'body',
    'title',
    'message',
    'buttonRow',
    'cancelButton',
    'cancelText',
    'confirmButton',
    'confirmText',
  ]).optional(),
})
