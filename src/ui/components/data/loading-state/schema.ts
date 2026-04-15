import { z } from 'zod'
import { dimensionValueSchema, extendComponentSchema } from '../../_base/schema'

export const LoadingStateSchema = extendComponentSchema({
  id: z.string().optional(),
  variant: z.enum(['spinner', 'skeleton']).optional().default('skeleton'),
  count: z.number().int().positive().optional().default(3),
  height: dimensionValueSchema.optional().default(48),
  testID: z.string().optional(),
})
