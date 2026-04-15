import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const PasswordInputSchema = extendComponentSchema({
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  helperText: z.string().optional(),
  errorText: z.union([z.string(), FromRefSchema]).optional(),
  defaultValue: z.string().optional(),
  value: z.union([z.string(), FromRefSchema]).optional(),
  showToggle: z.boolean().optional().default(true),
  autoComplete: z.string().optional(),
  maxLength: z.number().optional(),
  onChangeAction: ActionSchema.optional(),
  onSubmitAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
