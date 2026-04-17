import type { z } from 'zod'
import type { FilterBarSchema } from './schema'

export type FilterBarConfig = z.input<typeof FilterBarSchema>
