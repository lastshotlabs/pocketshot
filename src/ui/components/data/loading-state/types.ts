import type { z } from 'zod'
import type { LoadingStateSchema } from './schema'

export type LoadingStateConfig = z.infer<typeof LoadingStateSchema>
