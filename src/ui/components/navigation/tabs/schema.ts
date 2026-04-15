
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const TabsSchema = extendComponentSchema({
  id: z.string(),
  tabs: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      icon: z.string().optional(),
    }),
  ),
  defaultTab: z.string().optional(),
  activeTab: z.union([z.string(), FromRefSchema]).optional(),
  variant: z.enum(['default', 'pills', 'underline']).optional().default('default'),
  onTabChange: ActionSchema.optional(),
  testID: z.string().optional(),
})

