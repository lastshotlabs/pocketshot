import type { z } from 'zod'
import type { LabelSchema } from './schema'

export type LabelConfig = z.infer<typeof LabelSchema>
