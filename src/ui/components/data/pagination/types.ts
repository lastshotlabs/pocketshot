import type { z } from 'zod'
import type { PaginationSchema } from './schema'

export type PaginationConfig = z.input<typeof PaginationSchema>
