import type { z } from 'zod'
import type { LoadingStateSchema } from './schema'

export type LoadingStateConfig = z.input<typeof LoadingStateSchema>
