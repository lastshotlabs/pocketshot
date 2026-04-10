import type { z } from 'zod'
import type { DatePickerSchema } from './schema'

export type DatePickerConfig = z.infer<typeof DatePickerSchema>
