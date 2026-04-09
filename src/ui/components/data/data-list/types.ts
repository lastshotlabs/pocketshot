import type { z } from 'zod'
import type { DataListSchema } from './schema'

export type DataListConfig = z.infer<typeof DataListSchema>
