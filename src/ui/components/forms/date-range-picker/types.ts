import type { z } from 'zod'
import type { DateRangePickerSchema } from './schema'

export type DateRangePickerConfig = z.infer<typeof DateRangePickerSchema>
