import { z } from 'zod'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

const FromRefSchema = z.object({ from: z.string() })

export const SwitchSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  defaultValue: z.boolean().optional().default(false),
  value: z.union([z.boolean(), FromRefSchema]).optional(),
  onChangeAction: ActionSchema.optional(),
  disabled: z.boolean().optional().default(false),
  testID: z.string().optional(),
})
