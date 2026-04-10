import { z } from 'zod'

export const KeyboardAvoidingScreenSchema = z.object({
  id: z.string().optional(),
  scrollable: z.boolean().optional().default(true),
  background: z.string().optional(),
  padding: z.number().optional(),
  behavior: z.enum(['padding', 'height', 'position']).optional(),
  testID: z.string().optional(),
})
