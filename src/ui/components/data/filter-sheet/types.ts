import type { z } from 'zod'
import type { FilterSheetSchema, FilterSheetSectionSchema } from './schema'

export type FilterSheetConfig = z.input<typeof FilterSheetSchema>
export type FilterSheetSectionConfig = z.input<typeof FilterSheetSectionSchema>
