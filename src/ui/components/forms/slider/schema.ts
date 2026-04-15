import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()


export const SliderSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  min: z.number().optional().default(0),
  max: z.number().optional().default(100),
  step: z.number().optional().default(1),
  defaultValue: z.number().optional(),
  value: z.union([z.number(), FromRefSchema]).optional(),
  showValue: z.boolean().optional().default(true),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
