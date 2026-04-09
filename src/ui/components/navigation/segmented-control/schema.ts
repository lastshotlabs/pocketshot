import { z } from 'zod'

const ActionSchema = z.custom<import('../../../actions/types').Action>()
const FromRefSchema = z.object({ from: z.string() })

export const SegmentedControlSchema = z.object({
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
