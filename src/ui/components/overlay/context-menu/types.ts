import type { z } from 'zod'
import type { ContextMenuSchema } from './schema'

export type ContextMenuConfig = z.infer<typeof ContextMenuSchema>
