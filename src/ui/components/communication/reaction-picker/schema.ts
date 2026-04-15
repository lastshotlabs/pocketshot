import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const ReactionPickerSchema = extendComponentSchema({
  id: z.string(),
  reactions: z.array(z.string()).default(['👍', '❤️', '😂', '😮', '😢', '🔥']),
  onSelect: ActionSchema,
  triggerLabel: z.string().optional(),
  testID: z.string().optional(),
})
