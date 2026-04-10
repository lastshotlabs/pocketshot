import type { z } from 'zod'
import type { SearchBarSchema } from './schema'

export type SearchBarConfig = z.input<typeof SearchBarSchema>
