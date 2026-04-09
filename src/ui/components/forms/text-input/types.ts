import type { z } from 'zod'
import type { TextInputSchema } from './schema'

export type TextInputConfig = z.infer<typeof TextInputSchema>
