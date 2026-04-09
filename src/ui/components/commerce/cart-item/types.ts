import type { z } from 'zod'
import type { CartItemSchema } from './schema'

export type CartItemConfig = z.infer<typeof CartItemSchema>
