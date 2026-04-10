import type { z } from 'zod'
import type { SaveIndicatorSchema } from './schema'

export type SaveIndicatorConfig = z.input<typeof SaveIndicatorSchema>
