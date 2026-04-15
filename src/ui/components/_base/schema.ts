import { z } from 'zod'
import {
  activeConfigSchema,
  componentAnimationSchema,
  componentBackgroundSchema,
  componentTokenOverridesSchema,
  componentTransitionSchema,
  componentZIndexSchema,
  extendSharedComponentSchema,
  focusConfigSchema,
  hoverConfigSchema,
  sharedBaseComponentSchema,
  slotStateNameSchema,
  slotsSchema,
  styleableElementSchema,
} from '@lastshotlabs/frontend-contract/components'

export {
  activeConfigSchema,
  componentAnimationSchema,
  componentBackgroundSchema,
  componentTokenOverridesSchema,
  componentTransitionSchema,
  componentZIndexSchema,
  focusConfigSchema,
  hoverConfigSchema,
  sharedBaseComponentSchema,
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
