import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'

export const DividerSchema = extendComponentSchema({
  thickness: z.number().optional().default(1),
  orientation: z.enum(['horizontal', 'vertical']).optional().default('horizontal'),
  slots: slotsSchema(['root', 'line']).optional(),
})
