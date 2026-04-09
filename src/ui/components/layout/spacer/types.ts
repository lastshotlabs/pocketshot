import type { z } from 'zod'
import type { SpacerSchema } from './schema'

export type SpacerConfig = z.input<typeof SpacerSchema>
