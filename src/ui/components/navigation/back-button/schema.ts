import { z } from 'zod'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const BackButtonSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional().default('Back'),
  action: ActionSchema.optional(),
  testID: z.string().optional(),
})
