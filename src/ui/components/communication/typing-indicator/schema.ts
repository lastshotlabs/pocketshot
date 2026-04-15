import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const TypingIndicatorSchema = extendComponentSchema({
  id: z.string().optional(),
  isTyping: z.union([z.boolean(), FromRefSchema]).default(false),
  userName: z.union([z.string(), FromRefSchema]).optional(),
  slots: slotsSchema(['root', 'dots', 'dot', 'text']).optional(),
  testID: z.string().optional(),
})
