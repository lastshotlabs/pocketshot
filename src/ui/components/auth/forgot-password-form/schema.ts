import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const ForgotPasswordFormSchema = z.object({
  id: z.string().optional(),
  onSubmit: ActionSchema,
  submitLabel: z.string().optional().default('Send Reset Email'),
  backAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
