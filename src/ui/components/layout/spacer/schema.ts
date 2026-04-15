import { z } from 'zod'
import { extendComponentSchema } from '../../_base'

export const SpacerSchema = extendComponentSchema({
  size: z.number().optional().default(4),
  flex: z.boolean().optional().default(false),
})
