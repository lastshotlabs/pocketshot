import { z } from 'zod'
import { extendComponentSchema } from '../../_base'

export const KeyboardAvoidingScreenSchema = extendComponentSchema({
  id: z.string().optional(),
  scrollable: z.boolean().optional().default(true),
  background: z.string().optional(),
  padding: z.number().optional(),
  behavior: z.enum(['padding', 'height', 'position']).optional(),
  testID: z.string().optional(),
})
