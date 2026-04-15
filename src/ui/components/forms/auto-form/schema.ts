import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()


const FieldOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

const AutoFormFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'email', 'password', 'number', 'select', 'checkbox', 'switch']),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().optional().default(false),
  options: z.array(FieldOptionSchema).optional(),
  defaultValue: z.union([z.string(), z.boolean(), z.number()]).optional(),
})

export const AutoFormSchema = z.object({
  id: z.string(),
  fields: z.array(AutoFormFieldSchema),
  submitLabel: z.string().optional().default('Submit'),
  onSubmit: ActionSchema,
  onSubmitKey: z.string().optional().default('__formData'),
  validationErrors: FromRefSchema.optional(),
  testID: z.string().optional(),
})
