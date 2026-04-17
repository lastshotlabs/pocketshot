import type { z } from 'zod'
import type { VideoPlayerSchema } from './schema'

export type VideoPlayerConfig = z.input<typeof VideoPlayerSchema>
