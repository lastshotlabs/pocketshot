import { z } from 'zod'

export const SpacerSchema = z.object({
  size: z.number().optional().default(4),
  flex: z.boolean().optional().default(false),
})
