import type { z } from 'zod'
import type { EmptyStateSchema } from './schema'

export type EmptyStateConfig = z.input<typeof EmptyStateSchema>
