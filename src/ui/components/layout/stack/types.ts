import type { z } from 'zod'
import type { StackSchema } from './schema'

export type StackConfig = z.infer<typeof StackSchema>
