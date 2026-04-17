import { z } from 'zod'
import { componentTextAlignSchema, extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const HeadingSchema = extendComponentSchema({
  text: z.union([z.string(), FromRefSchema]),
  level: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)])
    .optional()
    .default(2),
  textAlign: componentTextAlignSchema.optional().default('left'),
  slots: slotsSchema(['root', 'text']).optional(),
})
