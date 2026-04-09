import type { z } from 'zod'
import type { ImageSchema } from './schema'

export type ImageConfig = z.input<typeof ImageSchema>
