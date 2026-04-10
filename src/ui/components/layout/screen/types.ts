import type { z } from 'zod'
import type { ScreenSchema } from './schema'

export type ScreenConfig = z.input<typeof ScreenSchema>
