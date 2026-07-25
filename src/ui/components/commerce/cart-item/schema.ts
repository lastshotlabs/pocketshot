import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema, looseSlots } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const CartItemSchema = extendComponentSchema({
  id: z.string().optional(),
  image: z.union([z.string(), FromRefSchema]).optional(),
  title: z.union([z.string(), FromRefSchema]),
  variant: z.union([z.string(), FromRefSchema]).optional(),
  price: z.union([z.number(), FromRefSchema]),
  quantity: z.union([z.number().int().nonnegative(), FromRefSchema]).optional().default(1),
  currency: z.string().optional().default('USD'),
  onQuantityChange: ActionSchema.optional(),
  onRemove: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: looseSlots([
    'root',
    'row',
    'thumbnail',
    'thumbnailPlaceholder',
    'thumbnailPlaceholderText',
    'content',
    'title',
    'variant',
    'price',
    'rightColumn',
    'removeButton',
    'removeButtonText',
    'quantityControls',
    'quantityButton',
    'quantityButtonText',
    'quantityValue',
    'total',
  ]).optional(),
})
