import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

const OptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  disabled: z.boolean().optional(),
})

export const RadioGroupSchema = extendComponentSchema({
  id: z.string(),
  label: z.string().optional(),
  options: z.union([z.array(OptionSchema), FromRefSchema]),
  defaultValue: z.string().optional(),
  value: z.union([z.string(), FromRefSchema]).optional(),
  orientation: z.enum(['vertical', 'horizontal']).optional().default('vertical'),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'container',
    'label',
    'optionsList',
    'option',
    'control',
    'indicator',
    'optionLabel',
  ]).optional(),
})
