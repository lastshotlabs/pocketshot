import { z } from 'zod'
import {
  componentAlignItemsSchema,
  componentFlexWrapSchema,
  componentJustifyContentSchema,
  extendComponentSchema,
  slotsSchema,
  spacingValueSchema,
} from '../../_base/schema'

export const RowSchema = extendComponentSchema({
  gap: spacingValueSchema.optional().default(0),
  alignItems: componentAlignItemsSchema.optional().default('stretch'),
  justifyContent: componentJustifyContentSchema.optional().default('start'),
  flexWrap: componentFlexWrapSchema.optional().default('nowrap'),
  children: z.array(z.unknown()).optional(),
  slots: slotsSchema(['root', 'item']).optional(),
})
