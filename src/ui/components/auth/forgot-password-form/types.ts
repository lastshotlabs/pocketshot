import type { z } from 'zod'
import type { ForgotPasswordFormSchema } from './schema'

export type ForgotPasswordFormConfig = z.infer<typeof ForgotPasswordFormSchema>
