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
import type { StatefulElementConfig } from '@lastshotlabs/frontend-contract/components'

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

/**
 * Like `slotsSchema`, but returns a size-bounded static type.
 *
 * Components with many slots (~25+) produce inferred config types whose declaration
 * exceeds TypeScript's serialization limit (TS7056) under zod 4 — each slot inlines the
 * full stateful-element type. This keeps the runtime schema identical (validation is
 * unchanged) while typing the slot map as a single `StatefulElementConfig` reference per
 * key instead of an inlined copy. Components already read `config.slots` generically, so
 * no precision is lost in practice. Use it for high-slot-count components; `slotsSchema`
 * is fine everywhere else.
 */
export function looseSlots<const T extends readonly [string, ...string[]]>(
  slotNames: T,
): z.ZodType<
  Partial<Record<T[number], StatefulElementConfig>>,
  Partial<Record<T[number], StatefulElementConfig>>
> {
  return slotsSchema(slotNames) as unknown as z.ZodType<
    Partial<Record<T[number], StatefulElementConfig>>,
    Partial<Record<T[number], StatefulElementConfig>>
  >
}
