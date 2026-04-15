import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const ChatBubbleSchema = extendComponentSchema({
  id: z.string().optional(),
  message: z.union([z.string(), FromRefSchema]),
  sender: z.string().optional(),
  timestamp: z.union([z.string(), FromRefSchema]).optional(),
  isOwn: z.union([z.boolean(), FromRefSchema]).optional().default(false),
  status: z.enum(['sending', 'sent', 'read', 'error']).optional(),
  avatar: z
    .object({
      src: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  testID: z.string().optional(),
})
