import type { z } from 'zod'
import type { ProgressBarSchema } from './schema'

export type ProgressBarConfig = z.input<typeof ProgressBarSchema>
