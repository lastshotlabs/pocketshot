import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()


export const CheckboxSchema = z.object({
  id: z.string(),
  label: z.string(),
  defaultChecked: z.boolean().optional().default(false),
  checked: z.union([z.boolean(), FromRefSchema]).optional(),
  onChangeAction: ActionSchema.optional(),
  disabled: z.boolean().optional().default(false),
  testID: z.string().optional(),
})
