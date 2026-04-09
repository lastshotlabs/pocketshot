import { z } from 'zod'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

const FromRefSchema = z.object({ from: z.string() })

export const TextInputSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  helperText: z.string().optional(),
  errorText: z.union([z.string(), FromRefSchema]).optional(),
  defaultValue: z.string().optional(),
  value: z.union([z.string(), FromRefSchema]).optional(),
  secureTextEntry: z.boolean().optional().default(false),
  keyboardType: z
    .enum(['default', 'email-address', 'numeric', 'phone-pad', 'url'])
    .optional()
    .default('default'),
  autoCapitalize: z
    .enum(['none', 'sentences', 'words', 'characters'])
    .optional()
    .default('sentences'),
  autoComplete: z.string().optional(),
  multiline: z.boolean().optional().default(false),
  numberOfLines: z.number().optional(),
  maxLength: z.number().optional(),
  onChangeAction: ActionSchema.optional(),
  onSubmitAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
