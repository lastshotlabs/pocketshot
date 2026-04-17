import type { z } from 'zod'
import type { InlineEditSchema } from './schema'

export type InlineEditConfig = z.input<typeof InlineEditSchema>
