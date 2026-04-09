import type { z } from 'zod'
import type { DividerSchema } from './schema'

export type DividerConfig = z.infer<typeof DividerSchema>
