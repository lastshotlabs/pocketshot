import type { z } from 'zod'
import type { BottomSheetSchema } from './schema'

export type BottomSheetConfig = z.infer<typeof BottomSheetSchema>
