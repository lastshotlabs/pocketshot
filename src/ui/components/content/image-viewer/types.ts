import type { z } from 'zod'
import type { ImageViewerSchema } from './schema'

export type ImageViewerConfig = z.infer<typeof ImageViewerSchema>
