import type { z } from 'zod'
import type { AlertSchema } from './schema'

export type AlertConfig = z.input<typeof AlertSchema>
