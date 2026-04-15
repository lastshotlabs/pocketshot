
import { extendComponentSchema } from '../../_base'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const ProductCardSchema = extendComponentSchema({
  id: z.string().optional(),
  image: z.union([z.string(), z.object({ from: z.string() })]).optional(),
  title: z.union([z.string(), z.object({ from: z.string() })]),
  description: z.union([z.string(), z.object({ from: z.string() })]).optional(),
  price: z.union([z.number(), z.object({ from: z.string() })]).optional(),
  currency: z.string().optional().default('USD'),
  badge: z.string().optional(),
  rating: z.union([z.number().min(0).max(5), z.object({ from: z.string() })]).optional(),
  reviewCount: z.union([z.number().int().nonnegative(), z.object({ from: z.string() })]).optional(),
  onPress: ActionSchema.optional(),
  onAddToCart: ActionSchema.optional(),
  testID: z.string().optional(),
})

