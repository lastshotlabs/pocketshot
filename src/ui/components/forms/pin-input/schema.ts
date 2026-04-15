
import { extendComponentSchema } from '../../_base'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const PinInputSchema = extendComponentSchema({
  id: z.string(),
  label: z.string().optional(),
  length: z.number().int().min(1).max(12).optional().default(6),
  secureEntry: z.boolean().optional().default(false),
  autoFocus: z.boolean().optional().default(false),
  onComplete: ActionSchema.optional(),
  testID: z.string().optional(),
})

