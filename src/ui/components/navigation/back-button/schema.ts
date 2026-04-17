import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const BackButtonSchema = extendComponentSchema({
  label: z.string().optional().default('Back'),
  action: ActionSchema.optional(),
  slots: slotsSchema(['root', 'button', 'icon', 'label']).optional(),
})
