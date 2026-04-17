import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'

export const ToastSchema = extendComponentSchema({
  id: z.string().optional(),
  position: z.enum(['top', 'bottom']).optional().default('bottom'),
  slots: slotsSchema(['root', 'container', 'toast', 'icon', 'message']).optional(),
})
