import type { z } from 'zod'
import type { BodySchema } from './schema'

export type BodyConfig = z.input<typeof BodySchema>
