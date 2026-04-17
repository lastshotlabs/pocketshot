import type { z } from 'zod'
import type { TimePickerSchema } from './schema'

export type TimePickerConfig = z.input<typeof TimePickerSchema>
