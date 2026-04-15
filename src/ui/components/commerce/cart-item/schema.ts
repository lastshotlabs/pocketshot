
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema } from '../../_base'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const CartItemSchema = extendComponentSchema({
  id: z.string().optional(),
  image: z.union([z.string(), FromRefSchema]).optional(),
  title: z.union([z.string(), FromRefSchema]),
  variant: z.union([z.string(), FromRefSchema]).optional(),
  price: z.union([z.number(), FromRefSchema]),
  quantity: z
    .union([z.number().int().nonnegative(), FromRefSchema])
    .optional()
    .default(1),
  currency: z.string().optional().default('USD'),
  onQuantityChange: ActionSchema.optional(),
  onRemove: ActionSchema.optional(),
  testID: z.string().optional(),
})



