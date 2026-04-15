import { z } from 'zod'
import { extendComponentSchema } from '../../_base'

/**
 * Action is typed as unknown in the schema because the Action discriminated
 * union is defined in types.ts (not Zod). Runtime type safety is enforced by
 * the action executor. The config prop is narrowed via CardConfig.
 */
const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const CardSchema = extendComponentSchema({
  id: z.string().optional(),
  padding: z.number().optional().default(4),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'xl', '2xl']).optional().default('lg'),
  shadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional().default('md'),
  backgroundColor: z.string().optional(),
  onPress: ActionSchema.optional(),
  testID: z.string().optional(),
})
