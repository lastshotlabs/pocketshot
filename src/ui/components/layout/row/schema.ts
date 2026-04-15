import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'

export const RowSchema = extendComponentSchema({
  id: z.string().optional(),
  gap: z.number().optional().default(0),
  padding: z.number().optional(),
  paddingHorizontal: z.number().optional(),
  paddingVertical: z.number().optional(),
  align: z.enum(['flex-start', 'center', 'flex-end', 'stretch']).optional().default('stretch'),
  justify: z
    .enum(['flex-start', 'center', 'flex-end', 'space-between', 'space-around'])
    .optional()
    .default('flex-start'),
  wrap: z.boolean().optional().default(false),
  children: z.array(z.unknown()).optional(),
  backgroundColor: z.string().optional(),
  testID: z.string().optional(),
})
