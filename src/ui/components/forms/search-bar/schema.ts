import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const SearchBarSchema = extendComponentSchema({
  id: z.string(),
  placeholder: z.string().optional().default('Search...'),
  debounceMs: z.number().optional().default(300),
  showCancelButton: z.boolean().optional().default(false),
  autoFocus: z.boolean().optional().default(false),
  onChangeAction: ActionSchema.optional(),
  onSubmitAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
