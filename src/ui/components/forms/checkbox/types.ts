import type { z } from 'zod'
import type { CheckboxSchema } from './schema'

export type CheckboxConfig = z.input<typeof CheckboxSchema>
