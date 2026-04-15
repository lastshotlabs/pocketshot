
import { extendComponentSchema } from '../../_base'

export const LoadingStateSchema = extendComponentSchema({
  id: z.string().optional(),
  variant: z.enum(['spinner', 'skeleton']).optional().default('skeleton'),
  count: z.number().int().positive().optional().default(3),
  height: z.number().positive().optional().default(48),
  testID: z.string().optional(),
})

