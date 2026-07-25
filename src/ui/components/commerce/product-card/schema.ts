import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema, looseSlots } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const ProductCardSchema = extendComponentSchema({
  id: z.string().optional(),
  image: z.union([z.string(), FromRefSchema]).optional(),
  title: z.union([z.string(), FromRefSchema]),
  description: z.union([z.string(), FromRefSchema]).optional(),
  price: z.union([z.number(), FromRefSchema]).optional(),
  currency: z.string().optional().default('USD'),
  badge: z.string().optional(),
  rating: z.union([z.number().min(0).max(5), FromRefSchema]).optional(),
  reviewCount: z.union([z.number().int().nonnegative(), FromRefSchema]).optional(),
  onPress: ActionSchema.optional(),
  onAddToCart: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: looseSlots([
    'root',
    'pressable',
    'card',
    'image',
    'imagePlaceholder',
    'imagePlaceholderText',
    'badgeContainer',
    'badgeText',
    'body',
    'title',
    'description',
    'ratingRow',
    'ratingStarsRow',
    'ratingStar',
    'ratingCount',
    'priceRow',
    'price',
    'addButton',
    'addButtonText',
  ]).optional(),
})
