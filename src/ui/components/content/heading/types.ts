import type { z } from 'zod'
import type { HeadingSchema } from './schema'

export type HeadingConfig = z.infer<typeof HeadingSchema>
