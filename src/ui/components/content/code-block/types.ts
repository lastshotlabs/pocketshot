import type { z } from 'zod'
import type { CodeBlockSchema } from './schema'

export type CodeBlockConfig = z.infer<typeof CodeBlockSchema>
