import { z } from 'zod'
import { extendComponentSchema, spacingValueSchema } from '../../_base/schema'

export const ScreenSchema = extendComponentSchema({
  scrollable: z.boolean().optional().default(true),
  padding: spacingValueSchema.optional().default('lg'),
  edges: z
    .array(z.enum(['top', 'bottom', 'left', 'right']))
    .optional()
    .default(['top', 'bottom', 'left', 'right']),
})
