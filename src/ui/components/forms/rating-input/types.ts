import type { z } from 'zod'
import type { RatingInputSchema } from './schema'

export type RatingInputConfig = z.input<typeof RatingInputSchema>
