import { z } from 'zod'
import { extendComponentSchema, slotsSchema, spacingValueSchema } from '../../_base/schema'

export const SectionSchema = extendComponentSchema({
  title: z.string().optional(),
  description: z.string().optional(),
  padding: spacingValueSchema.optional().default('lg'),
  titleSize: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  children: z.array(z.unknown()).optional(),
  slots: slotsSchema(['root', 'item']).optional(),
})
