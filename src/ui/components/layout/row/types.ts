import type { z } from 'zod'
import type { RowSchema } from './schema'

export type RowConfig = z.infer<typeof RowSchema>
