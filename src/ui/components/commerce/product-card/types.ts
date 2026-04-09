import type { z } from 'zod'
import type { ProductCardSchema } from './schema'

export type ProductCardConfig = z.infer<typeof ProductCardSchema>
