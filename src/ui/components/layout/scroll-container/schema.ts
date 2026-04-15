
import { extendComponentSchema } from '../../_base'

/**
 * Action is typed via z.custom at the boundaries since Action is defined as a
 * TypeScript discriminated union, not a Zod schema. Runtime validation is
 * enforced by the action executor.
 */
const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const ScrollContainerSchema = extendComponentSchema({
  id: z.string().optional(),
  horizontal: z.boolean().optional().default(false),
  showsScrollIndicator: z.boolean().optional().default(false),
  padding: z.number().optional(),
  contentPadding: z.number().optional(),
  refreshable: z.boolean().optional().default(false),
  onRefresh: ActionSchema.optional(),
  testID: z.string().optional(),
})

