import type { z } from 'zod'
import type { ScrollContainerSchema } from './schema'

export type ScrollContainerConfig = z.input<typeof ScrollContainerSchema>
