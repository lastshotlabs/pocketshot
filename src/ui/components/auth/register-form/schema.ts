import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const RegisterFormSchema = z.object({
  id: z.string().optional(),
  fields: z
    .array(z.enum(['email', 'username', 'password', 'confirmPassword']))
    .optional()
    .default(['email', 'password']),
  onSubmit: ActionSchema,
  submitLabel: z.string().optional().default('Create Account'),
  loginAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
