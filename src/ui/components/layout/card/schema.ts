import { z } from 'zod'
import {
  extendComponentSchema,
  radiusValueSchema,
  shadowValueSchema,
  spacingValueSchema,
} from '../../_base/schema'

/**
 * Action is typed as unknown in the schema because the Action discriminated
 * union is defined in types.ts (not Zod). Runtime type safety is enforced by
 * the action executor. The config prop is narrowed via CardConfig.
 */
const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const CardSchema = extendComponentSchema({
  padding: spacingValueSchema.optional().default('lg'),
  borderRadius: radiusValueSchema.optional().default('lg'),
  shadow: shadowValueSchema.optional().default('md'),
  onPress: ActionSchema.optional(),
})
