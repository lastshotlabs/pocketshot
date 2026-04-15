
import { extendComponentSchema } from '../../_base'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const AvatarSchema = extendComponentSchema({
  id: z.string().optional(),
  src: z.union([z.string(), z.object({ from: z.string() })]).optional(),
  name: z.union([z.string(), z.object({ from: z.string() })]).optional(),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional().default('md'),
  shape: z.enum(['circle', 'rounded', 'square']).optional().default('circle'),
  onPress: ActionSchema.optional(),
  testID: z.string().optional(),
})

