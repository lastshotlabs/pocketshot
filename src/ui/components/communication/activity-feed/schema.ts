
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'


export const ActivityFeedSchema = extendComponentSchema({
  id: z.string().optional(),
  data: z.union([z.string(), FromRefSchema]).optional(),
  emptyMessage: z.string().optional().default('No activity yet'),
  itemHeight: z.number().optional().default(72),
  testID: z.string().optional(),
})

