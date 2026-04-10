import type { z } from 'zod'
import type { AudioPlayerSchema } from './schema'

export type AudioPlayerConfig = z.infer<typeof AudioPlayerSchema>
