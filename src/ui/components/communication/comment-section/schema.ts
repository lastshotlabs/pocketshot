import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const CommentSectionSchema = extendComponentSchema({
  id: z.string(),
  data: z.union([z.string(), FromRefSchema]),
  currentUserId: z.string().optional(),
  maxNestingLevel: z.number().int().min(0).default(2),
  allowReplies: z.boolean().default(true),
  onSubmitComment: ActionSchema.optional(),
  onLikeComment: ActionSchema.optional(),
  onDeleteComment: ActionSchema.optional(),
  testID: z.string().optional(),
})
