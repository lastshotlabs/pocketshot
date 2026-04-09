import type { z } from 'zod'
import type { RegisterFormSchema } from './schema'

export type RegisterFormConfig = z.infer<typeof RegisterFormSchema>
