import type { z } from 'zod'
import type { QuickAddSchema } from './schema'

export type QuickAddConfig = z.input<typeof QuickAddSchema>
