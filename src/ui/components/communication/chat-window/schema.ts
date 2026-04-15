import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const ChatWindowSchema = extendComponentSchema({
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
