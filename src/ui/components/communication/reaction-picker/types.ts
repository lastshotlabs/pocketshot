import type { z } from 'zod'
import type { ReactionPickerSchema } from './schema'

export type ReactionPickerConfig = z.input<typeof ReactionPickerSchema>
