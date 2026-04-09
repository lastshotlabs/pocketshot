import type { z } from 'zod'
import type { CardSchema } from './schema'

export type CardConfig = z.infer<typeof CardSchema>
