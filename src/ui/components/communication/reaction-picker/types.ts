import type { z } from 'zod'
import type { ReactionPickerSchema } from './schema'

export type ReactionPickerConfig = z.infer<typeof ReactionPickerSchema>
