import { z } from 'zod'
import { extendComponentSchema, spacingValueSchema } from '../../_base/schema'

/**
 * Action is typed via z.custom at the boundaries since Action is defined as a
 * TypeScript discriminated union, not a Zod schema. Runtime validation is
 * enforced by the action executor.
 */
const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const ScrollContainerSchema = extendComponentSchema({
  horizontal: z.boolean().optional().default(false),
  showsScrollIndicator: z.boolean().optional().default(false),
  contentPadding: spacingValueSchema.optional(),
  refreshable: z.boolean().optional().default(false),
  onRefresh: ActionSchema.optional(),
})
