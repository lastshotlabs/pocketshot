import { z } from 'zod'
import { extendComponentSchema, spacingValueSchema, slotsSchema } from '../../_base/schema'

export const KeyboardAvoidingScreenSchema = extendComponentSchema({
  scrollable: z.boolean().optional().default(true),
  padding: spacingValueSchema.optional().default('lg'),
  behavior: z.enum(['padding', 'height', 'position']).optional(),
  slots: slotsSchema(['root', 'keyboardAvoiding', 'viewport', 'content']).optional(),
})
