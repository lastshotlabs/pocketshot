import type { z } from 'zod'
import type { TimelineSchema } from './schema'

export type TimelineConfig = z.input<typeof TimelineSchema>
export type TimelineItem = NonNullable<TimelineConfig['items']>[number]
