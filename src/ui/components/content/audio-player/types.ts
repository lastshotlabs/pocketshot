import type { z } from 'zod'
import type { AudioPlayerSchema } from './schema'

export type AudioPlayerConfig = z.input<typeof AudioPlayerSchema>
