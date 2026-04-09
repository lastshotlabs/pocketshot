import type { z } from 'zod'
import type { PriceDisplaySchema } from './schema'

export type PriceDisplayConfig = z.input<typeof PriceDisplaySchema>
