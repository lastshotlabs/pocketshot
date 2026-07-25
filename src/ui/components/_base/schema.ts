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

type BaseComponentInput = z.input<typeof baseComponentSchema>
type BaseComponentOutput = z.output<typeof baseComponentSchema>
type MergeComponentShape<Base, Override> = Omit<Base, keyof Override> & Override

/**
 * Extends the shared component contract without serializing the entire shared
 * Zod object into every consumer declaration.
 *
 * The explicit ZodType boundary is important: leaving this return type inferred
 * makes TypeScript repeat the full responsive/style/state/slot schema for every
 * component. That previously produced a 66 MB bundled `ui.d.ts` and TS7056
 * failures. Input/output precision remains intact because the component-specific
 * shape is still inferred from `T`.
 */
export function extendComponentSchema<T extends z.ZodRawShape>(
  shape: T,
): z.ZodType<
  MergeComponentShape<BaseComponentOutput, z.output<z.ZodObject<T>>>,
  MergeComponentShape<BaseComponentInput, z.input<z.ZodObject<T>>>
> {
  return extendSharedComponentSchema({
    testID: z.string().optional(),
    ...shape,
    // Zod's object internals are intentionally opaque here. Runtime validation is
    // unchanged; this cast only prevents declaration serialization from expanding
    // the full shared object into every component.
  }) as unknown as z.ZodType<
    MergeComponentShape<BaseComponentOutput, z.output<z.ZodObject<T>>>,
    MergeComponentShape<BaseComponentInput, z.input<z.ZodObject<T>>>
  >
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
