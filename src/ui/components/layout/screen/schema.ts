import { z } from 'zod'

export const ScreenSchema = z.object({
  id: z.string().optional(),
  scrollable: z.boolean().optional().default(true),
  background: z.string().optional(),
  padding: z.number().optional(),
  edges: z
    .array(z.enum(['top', 'bottom', 'left', 'right']))
    .optional()
    .default(['top', 'bottom', 'left', 'right']),
  testID: z.string().optional(),
})
