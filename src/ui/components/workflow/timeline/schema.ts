import { z } from 'zod'

const TimelineItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  timestamp: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export const TimelineSchema = z.object({
  id: z.string().optional(),
  data: z.union([z.string(), z.object({ from: z.string() })]).optional(),
  items: z.array(TimelineItemSchema).optional(),
  testID: z.string().optional(),
})
