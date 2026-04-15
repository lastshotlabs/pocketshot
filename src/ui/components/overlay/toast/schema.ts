
import { extendComponentSchema } from '../../_base'

export const ToastSchema = extendComponentSchema({
  id: z.string().optional(),
  position: z.enum(['top', 'bottom']).optional().default('bottom'),
})

