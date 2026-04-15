import { z } from 'zod'
import { extendComponentSchema, spacingValueSchema } from '../../_base/schema'

export const KeyboardAvoidingScreenSchema = extendComponentSchema({
  scrollable: z.boolean().optional().default(true),
  padding: spacingValueSchema.optional().default('lg'),
  behavior: z.enum(['padding', 'height', 'position']).optional(),
})
