import type { z } from 'zod'
import type { HeaderSchema } from './schema'

export type HeaderConfig = z.input<typeof HeaderSchema>
