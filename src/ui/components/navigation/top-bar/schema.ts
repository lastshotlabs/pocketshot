
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

const CustomLeftActionSchema = z.object({
  icon: z.string(),
  onPress: ActionSchema,
})

const RightActionSchema = z.object({
  icon: z.string(),
  onPress: ActionSchema,
  badge: z.number().optional(),
})

export const TopBarSchema = extendComponentSchema({
  id: z.string().optional(),
  title: z.union([z.string(), FromRefSchema]),
  subtitle: z.string().optional(),
  leftAction: z
    .union([z.enum(['back', 'menu', 'close']), CustomLeftActionSchema])
    .optional(),
  rightActions: z.array(RightActionSchema).max(3).optional(),
  transparent: z.boolean().optional().default(false),
  elevated: z.boolean().optional().default(true),
  testID: z.string().optional(),
})

