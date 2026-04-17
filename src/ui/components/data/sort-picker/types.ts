import type { z } from 'zod'
import type { SortPickerSchema } from './schema'

export type SortPickerConfig = z.input<typeof SortPickerSchema>
