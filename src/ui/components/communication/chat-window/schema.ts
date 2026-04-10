import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const ChatWindowSchema = z.object({
  id: z.string(),
  data: z.union([z.string(), FromRefSchema]),
  currentUserId: z.union([z.string(), FromRefSchema]),
  placeholder: z.string().default('Message…'),
  maxLength: z.number().int().min(1).default(2000),
  onSendAction: ActionSchema,
  onAttachAction: ActionSchema.optional(),
  onTypingAction: ActionSchema.optional(),
  showAvatars: z.boolean().default(true),
  testID: z.string().optional(),
})
