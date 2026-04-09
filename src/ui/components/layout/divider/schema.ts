import { z } from 'zod'

export const DividerSchema = z.object({
  thickness: z.number().optional().default(1),
  color: z.string().optional(),
  marginVertical: z.number().optional().default(2),
  orientation: z.enum(['horizontal', 'vertical']).optional().default('horizontal'),
})
