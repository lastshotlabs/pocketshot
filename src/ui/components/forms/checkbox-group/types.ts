import type { z } from 'zod'
import type { CheckboxGroupSchema } from './schema'

export type CheckboxGroupConfig = z.input<typeof CheckboxGroupSchema>
