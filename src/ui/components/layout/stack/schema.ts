import { z } from 'zod'
import {
  componentAlignItemsSchema,
  componentJustifyContentSchema,
  extendComponentSchema,
  spacingValueSchema,
} from '../../_base/schema'

export const StackSchema = extendComponentSchema({
  gap: spacingValueSchema.optional().default(0),
  alignItems: componentAlignItemsSchema.optional().default('stretch'),
  justifyContent: componentJustifyContentSchema.optional().default('start'),
  children: z.array(z.unknown()).optional(),
})
