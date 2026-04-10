import type { z } from 'zod'
import type { ToggleSchema } from './schema'

export type ToggleConfig = z.infer<typeof ToggleSchema>
