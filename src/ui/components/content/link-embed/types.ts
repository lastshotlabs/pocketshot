import type { z } from 'zod'
import type { LinkEmbedSchema } from './schema'

export type LinkEmbedConfig = z.input<typeof LinkEmbedSchema>
