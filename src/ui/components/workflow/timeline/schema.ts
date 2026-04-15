
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema } from '../../_base'

const TimelineItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  timestamp: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export const TimelineSchema = extendComponentSchema({
  id: z.string().optional(),
  data: z.union([z.string(), FromRefSchema]).optional(),
  items: z.array(TimelineItemSchema).optional(),
  testID: z.string().optional(),
})



