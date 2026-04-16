import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import {
  extendComponentSchema,
  radiusValueSchema,
  shadowValueSchema,
  slotsSchema,
  spacingValueSchema,
} from '../../_base/schema'

/**
 * Action is typed as unknown in the schema because the Action discriminated
 * union is defined in types.ts (not Zod). Runtime type safety is enforced by
 * the action executor. The config prop is narrowed via CardConfig.
 */
const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const CardSchema = extendComponentSchema({
  title: z.union([z.string(), FromRefSchema]).optional(),
  subtitle: z.union([z.string(), FromRefSchema]).optional(),
  padding: spacingValueSchema.optional().default('lg'),
  gap: spacingValueSchema.optional(),
  borderRadius: radiusValueSchema.optional().default('lg'),
  shadow: shadowValueSchema.optional().default('md'),
  onPress: ActionSchema.optional(),
  slots: slotsSchema(['root', 'header', 'title', 'subtitle', 'content', 'item']).optional(),
})
