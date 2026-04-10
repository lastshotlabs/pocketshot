import type { z } from 'zod'
import type { SortPickerSchema } from './schema'

export type SortPickerConfig = z.infer<typeof SortPickerSchema>
