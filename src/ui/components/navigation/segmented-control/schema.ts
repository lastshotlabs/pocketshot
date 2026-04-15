import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const SegmentedControlSchema = extendComponentSchema({
  id: z.string(),
  options: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    }),
  ),
  defaultValue: z.string().optional(),
  value: z.union([z.string(), FromRefSchema]).optional(),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
