import type { z } from 'zod'
import type { LinkSchema } from './schema'

export type LinkConfig = z.input<typeof LinkSchema>
