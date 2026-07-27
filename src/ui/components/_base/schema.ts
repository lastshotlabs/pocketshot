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
  slotsSchema as sharedSlotsSchema,
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
  styleableElementSchema,
}

export const baseComponentSchema = sharedBaseComponentSchema.extend({
  testID: z.string().optional(),
})

export type BaseComponentInput = z.input<typeof baseComponentSchema>
export type BaseComponentOutput = z.output<typeof baseComponentSchema>
export type MergeComponentShape<Base, Override> = Omit<Base, keyof Override> & Override

/**
 * Public declaration boundary for a component schema extended with Pocketshot's
 * shared base component contract.
 *
 * Keeping this as a named exported type lets declaration consumers reference
 * the shared contract once instead of receiving its full responsive style,
 * state, and slot graph in every component schema declaration.
 */
export type ExtendedComponentSchema<T extends z.ZodRawShape> = z.ZodType<
  MergeComponentShape<BaseComponentOutput, z.core.$InferObjectOutput<T, {}>>,
  MergeComponentShape<BaseComponentInput, z.core.$InferObjectInput<T, {}>>
>

/**
 * Extends the shared component contract without serializing the entire shared
 * Zod object into every consumer declaration.
 *
 * The explicit ZodType boundary is important: leaving this return type inferred
 * makes TypeScript repeat the full responsive/style/state/slot schema for every
 * component. That previously produced more than 56 MB of package declarations
 * and TS7056 failures. Input/output precision remains intact because the
 * component-specific shape is still inferred from `T`.
 */
export function extendComponentSchema<T extends z.ZodRawShape>(
  shape: T,
): ExtendedComponentSchema<T> {
  return extendSharedComponentSchema({
    testID: z.string().optional(),
    ...shape,
    // Zod's object internals are intentionally opaque here. Runtime validation is
    // unchanged; this cast only prevents declaration serialization from expanding
    // the full shared object into every component.
  }) as unknown as ExtendedComponentSchema<T>
}

/**
 * Builds a runtime slot schema behind a size-bounded public type.
 *
 * Inferred Zod slot objects repeat the full stateful-element graph for every
 * slot in every component declaration. The mapped record retains exact slot
 * names and `StatefulElementConfig` values without serializing that graph.
 */
export function slotsSchema<const T extends readonly [string, ...string[]]>(
  slotNames: T,
): z.ZodType<
  Partial<Record<T[number], StatefulElementConfig>>,
  Partial<Record<T[number], StatefulElementConfig>>
> {
  return sharedSlotsSchema(slotNames) as unknown as z.ZodType<
    Partial<Record<T[number], StatefulElementConfig>>,
    Partial<Record<T[number], StatefulElementConfig>>
  >
}
