import { z } from 'zod'
import {
  activeConfigSchema,
  componentAnimationSchema,
  componentAlignItemsSchema,
  componentBackgroundSchema,
  componentFlexWrapSchema,
  componentJustifyContentSchema,
  componentTextAlignSchema,
  componentTokenOverridesSchema,
  componentTransitionSchema,
  componentZIndexSchema,
  dimensionValueSchema,
  extendSharedComponentSchema,
  focusConfigSchema,
  fontSizeValueSchema,
  fontWeightValueSchema,
  hoverConfigSchema,
  letterSpacingValueSchema,
  lineHeightValueSchema,
  radiusValueSchema,
  shadowValueSchema,
  sharedBaseComponentSchema,
  spacingValueSchema,
  slotStateNameSchema,
  slotsSchema,
  styleableElementSchema,
} from '@lastshotlabs/frontend-contract/components'

export {
  activeConfigSchema,
  componentAnimationSchema,
  componentAlignItemsSchema,
  componentBackgroundSchema,
  componentFlexWrapSchema,
  componentJustifyContentSchema,
  componentTextAlignSchema,
  componentTokenOverridesSchema,
  componentTransitionSchema,
  componentZIndexSchema,
  dimensionValueSchema,
  focusConfigSchema,
  fontSizeValueSchema,
  fontWeightValueSchema,
  hoverConfigSchema,
  letterSpacingValueSchema,
  lineHeightValueSchema,
  radiusValueSchema,
  shadowValueSchema,
  sharedBaseComponentSchema,
  spacingValueSchema,
  slotStateNameSchema,
  slotsSchema,
  styleableElementSchema,
}

export const baseComponentSchema = sharedBaseComponentSchema.extend({
  testID: z.string().optional(),
})

export function extendComponentSchema<T extends z.ZodRawShape>(shape: T) {
  return extendSharedComponentSchema({
    testID: z.string().optional(),
    ...shape,
  })
}
