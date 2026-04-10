import type { z } from 'zod'
import type { ProgressCircleSchema } from './schema'

export type ProgressCircleConfig = z.input<typeof ProgressCircleSchema>
