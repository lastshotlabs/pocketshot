
import { extendComponentSchema } from '../../_base'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const EmojiPickerSchema = extendComponentSchema({
  id: z.string(),
  onSelect: ActionSchema,
  recentEmojis: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  testID: z.string().optional(),
})

