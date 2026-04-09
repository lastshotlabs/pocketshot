import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const CartItemSchema = z.object({
  id: z.string().optional(),
  image: z.union([z.string(), z.object({ from: z.string() })]).optional(),
  title: z.union([z.string(), z.object({ from: z.string() })]),
  variant: z.union([z.string(), z.object({ from: z.string() })]).optional(),
  price: z.union([z.number(), z.object({ from: z.string() })]),
  quantity: z
    .union([z.number().int().nonnegative(), z.object({ from: z.string() })])
    .optional()
    .default(1),
  currency: z.string().optional().default('USD'),
  onQuantityChange: ActionSchema.optional(),
  onRemove: ActionSchema.optional(),
  testID: z.string().optional(),
})
