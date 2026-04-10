import type { z } from 'zod'
import type { RadioGroupSchema } from './schema'

export type RadioGroupConfig = z.input<typeof RadioGroupSchema>
