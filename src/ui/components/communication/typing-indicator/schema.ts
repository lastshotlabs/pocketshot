import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'


export const TypingIndicatorSchema = z.object({
  id: z.string().optional(),
  isTyping: z.union([z.boolean(), FromRefSchema]).default(false),
  userName: z.union([z.string(), FromRefSchema]).optional(),
  testID: z.string().optional(),
})
