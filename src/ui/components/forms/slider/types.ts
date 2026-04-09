import type { z } from 'zod'
import type { SliderSchema } from './schema'

export type SliderConfig = z.infer<typeof SliderSchema>
