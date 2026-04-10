import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const EmojiPickerSchema = z.object({
  id: z.string(),
  onSelect: ActionSchema,
  recentEmojis: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  testID: z.string().optional(),
})
