import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()


const OptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  disabled: z.boolean().optional(),
})

export const RadioGroupSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  options: z.union([z.array(OptionSchema), FromRefSchema]),
  defaultValue: z.string().optional(),
  value: z.union([z.string(), FromRefSchema]).optional(),
  orientation: z.enum(['vertical', 'horizontal']).optional().default('vertical'),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
