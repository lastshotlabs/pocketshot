import type { z } from 'zod'
import type { TextareaSchema } from './schema'

export type TextareaConfig = z.input<typeof TextareaSchema>
