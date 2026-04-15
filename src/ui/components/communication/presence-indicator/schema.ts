import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'


export const PresenceIndicatorSchema = z.object({
  id: z.string().optional(),
  status: z.union([z.enum(['online', 'offline', 'away', 'busy', 'idle']), FromRefSchema]).default(
    'offline',
  ),
  size: z.enum(['xs', 'sm', 'md', 'lg']).default('md'),
  showLabel: z.boolean().default(false),
  label: z.string().optional(),
  bordered: z.boolean().default(true),
  testID: z.string().optional(),
})
