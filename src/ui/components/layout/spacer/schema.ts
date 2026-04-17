import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'

export const SpacerSchema = extendComponentSchema({
  size: z.number().optional().default(4),
  flex: z.boolean().optional().default(false),
  slots: slotsSchema(['root']).optional(),
})
