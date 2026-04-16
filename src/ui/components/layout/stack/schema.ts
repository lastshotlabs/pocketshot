import { z } from 'zod'
import {
  componentAlignItemsSchema,
  componentJustifyContentSchema,
  extendComponentSchema,
  slotsSchema,
  spacingValueSchema,
} from '../../_base/schema'

export const StackSchema = extendComponentSchema({
  gap: spacingValueSchema.optional().default(0),
  alignItems: componentAlignItemsSchema.optional().default('stretch'),
  justifyContent: componentJustifyContentSchema.optional().default('start'),
  children: z.array(z.unknown()).optional(),
  slots: slotsSchema(['root', 'item']).optional(),
})
