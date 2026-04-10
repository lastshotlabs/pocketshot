import type { z } from 'zod'
import type { TimePickerSchema } from './schema'

export type TimePickerConfig = z.infer<typeof TimePickerSchema>
