import type { z } from 'zod'
import type { FilterSheetSchema, FilterSheetSectionSchema } from './schema'

export type FilterSheetConfig = z.infer<typeof FilterSheetSchema>
export type FilterSheetSectionConfig = z.infer<typeof FilterSheetSectionSchema>
