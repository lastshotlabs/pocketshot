import { z } from 'zod'

const ActionSchema = z.custom<import('../../../actions/types').Action>()
const FromRefSchema = z.object({ from: z.string() })

export const TabsSchema = z.object({
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
