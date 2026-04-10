import type { z } from 'zod'
import type { HighlightedTextSchema } from './schema'

export type HighlightedTextConfig = z.input<typeof HighlightedTextSchema>
