import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'


export const TypingIndicatorSchema = extendComponentSchema({
  id: z.string().optional(),
  isTyping: z.union([z.boolean(), FromRefSchema]).default(false),
  userName: z.union([z.string(), FromRefSchema]).optional(),
  testID: z.string().optional(),
})


