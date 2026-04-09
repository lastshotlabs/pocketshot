import type { z } from 'zod'
import type { CheckboxSchema } from './schema'

export type CheckboxConfig = z.infer<typeof CheckboxSchema>
