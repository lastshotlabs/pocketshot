import type { z } from 'zod'
import type { FavoriteButtonSchema } from './schema'

export type FavoriteButtonConfig = z.input<typeof FavoriteButtonSchema>
