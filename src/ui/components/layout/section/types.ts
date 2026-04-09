import type { z } from 'zod'
import type { SectionSchema } from './schema'

export type SectionConfig = z.infer<typeof SectionSchema>
