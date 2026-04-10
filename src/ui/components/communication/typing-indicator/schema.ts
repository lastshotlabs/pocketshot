import { z } from 'zod'

const FromRefSchema = z.object({ from: z.string() })

export const TypingIndicatorSchema = z.object({
  id: z.string().optional(),
  isTyping: z.union([z.boolean(), FromRefSchema]).default(false),
  userName: z.union([z.string(), FromRefSchema]).optional(),
  testID: z.string().optional(),
})
