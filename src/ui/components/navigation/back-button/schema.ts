import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const BackButtonSchema = extendComponentSchema({
  label: z.string().optional().default('Back'),
  action: ActionSchema.optional(),
})
