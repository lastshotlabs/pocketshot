import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

const OptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  disabled: z.boolean().optional(),
})

export const CheckboxGroupSchema = extendComponentSchema({
  id: z.string(),
  label: z.string().optional(),
  options: z.union([z.array(OptionSchema), FromRefSchema]),
  defaultValue: z.array(z.string()).optional().default([]),
  value: z.union([z.array(z.string()), FromRefSchema]).optional(),
  orientation: z.enum(['vertical', 'horizontal']).optional().default('vertical'),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
