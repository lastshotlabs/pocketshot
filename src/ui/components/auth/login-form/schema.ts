import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const LoginFormSchema = z.object({
  id: z.string().optional(),
  onSubmit: ActionSchema,
  submitLabel: z.string().optional().default('Sign In'),
  forgotPasswordAction: ActionSchema.optional(),
  registerAction: ActionSchema.optional(),
  showSocialButtons: z.boolean().optional().default(false),
  socialProviders: z
    .array(z.enum(['google', 'apple', 'github']))
    .optional()
    .default([]),
  testID: z.string().optional(),
})
