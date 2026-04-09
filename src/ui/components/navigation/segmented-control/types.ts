import type { z } from 'zod'
import type { SegmentedControlSchema } from './schema'

export type SegmentedControlConfig = z.infer<typeof SegmentedControlSchema>
