import { z } from 'zod'

export const LoadingStateSchema = z.object({
  id: z.string().optional(),
  variant: z.enum(['spinner', 'skeleton']).optional().default('skeleton'),
  count: z.number().int().positive().optional().default(3),
  height: z.number().positive().optional().default(48),
  testID: z.string().optional(),
})
