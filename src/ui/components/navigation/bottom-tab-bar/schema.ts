import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

const TabItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  badge: z.union([z.number(), FromRefSchema]).optional(),
  onPress: ActionSchema.optional(),
})

export const BottomTabBarSchema = extendComponentSchema({
  id: z.string(),
  tabs: z.array(TabItemSchema).min(2).max(5),
  activeTab: z.union([z.string(), FromRefSchema]).optional(),
  position: z.literal('bottom').optional().default('bottom'),
  elevated: z.boolean().optional().default(true),
  showLabels: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
