import type { z } from 'zod'
import type { PullToRefreshSchema } from './schema'

export type PullToRefreshConfig = z.infer<typeof PullToRefreshSchema>
