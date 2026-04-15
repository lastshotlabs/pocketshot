
import { extendComponentSchema } from '../../_base'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const QuickAddSchema = extendComponentSchema({
  id: z.string(),
  placeholder: z.string().optional(),
  submitLabel: z.string().optional(),
  icon: z.string().optional(),
  onSubmit: ActionSchema,
  testID: z.string().optional(),
})

