import type { z } from 'zod'
import type { TypingIndicatorSchema } from './schema'

export type TypingIndicatorConfig = z.input<typeof TypingIndicatorSchema>
