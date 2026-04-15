import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'

export const ToastSchema = extendComponentSchema({
  id: z.string().optional(),
  position: z.enum(['top', 'bottom']).optional().default('bottom'),
})
