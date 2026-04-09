import type { z } from 'zod'
import type { SegmentedControlSchema } from './schema'

export type SegmentedControlConfig = z.input<typeof SegmentedControlSchema>
