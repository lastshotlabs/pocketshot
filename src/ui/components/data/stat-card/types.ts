import type { z } from 'zod'
import type { StatCardSchema } from './schema'

export type StatCardConfig = z.input<typeof StatCardSchema>
