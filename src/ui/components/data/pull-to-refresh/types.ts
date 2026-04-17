import type { z } from 'zod'
import type { PullToRefreshSchema } from './schema'

export type PullToRefreshConfig = z.input<typeof PullToRefreshSchema>
