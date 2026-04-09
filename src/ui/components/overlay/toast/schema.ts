import { z } from 'zod'

export const ToastSchema = z.object({
  id: z.string().optional(),
  position: z.enum(['top', 'bottom']).optional().default('bottom'),
})
