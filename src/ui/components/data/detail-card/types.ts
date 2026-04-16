import type { z } from 'zod'
import type { DetailCardSchema } from './schema'

export type DetailCardConfig = z.input<typeof DetailCardSchema>
