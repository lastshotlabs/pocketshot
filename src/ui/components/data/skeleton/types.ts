import type { z } from 'zod'
import type { SkeletonSchema } from './schema'

export type SkeletonConfig = z.input<typeof SkeletonSchema>
