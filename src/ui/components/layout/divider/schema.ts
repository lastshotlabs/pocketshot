import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'

export const DividerSchema = extendComponentSchema({
  thickness: z.number().optional().default(1),
  color: z.string().optional(),
  marginVertical: z.number().optional().default(2),
  orientation: z.enum(['horizontal', 'vertical']).optional().default('horizontal'),
})
