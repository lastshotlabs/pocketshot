import { z } from 'zod'

const FromRefSchema = z.object({ from: z.string() })

export const ActivityFeedSchema = z.object({
  id: z.string().optional(),
  data: z.union([z.string(), FromRefSchema]).optional(),
  emptyMessage: z.string().optional().default('No activity yet'),
  itemHeight: z.number().optional().default(72),
  testID: z.string().optional(),
})
