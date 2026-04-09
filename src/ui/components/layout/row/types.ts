import type { z } from 'zod'
import type { RowSchema } from './schema'

export type RowConfig = z.input<typeof RowSchema>
