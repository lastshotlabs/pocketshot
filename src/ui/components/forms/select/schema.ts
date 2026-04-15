import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()


const OptionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const SelectSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional().default('Select an option'),
  options: z.union([z.array(OptionSchema), FromRefSchema]),
  value: z.union([z.string(), FromRefSchema]).optional(),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
