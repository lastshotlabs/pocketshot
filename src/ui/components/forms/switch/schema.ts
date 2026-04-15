import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const SwitchSchema = extendComponentSchema({
  id: z.string(),
  label: z.string().optional(),
  defaultValue: z.boolean().optional().default(false),
  value: z.union([z.boolean(), FromRefSchema]).optional(),
  onChangeAction: ActionSchema.optional(),
  disabled: z.boolean().optional().default(false),
  testID: z.string().optional(),
})
