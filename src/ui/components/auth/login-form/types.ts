import type { z } from 'zod'
import type { LoginFormSchema } from './schema'

export type LoginFormConfig = z.input<typeof LoginFormSchema>
