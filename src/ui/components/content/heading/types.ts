import type { z } from 'zod'
import type { HeadingSchema } from './schema'

export type HeadingConfig = z.input<typeof HeadingSchema>
