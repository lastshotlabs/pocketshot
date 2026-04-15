import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const PresenceIndicatorSchema = extendComponentSchema({
  id: z.string().optional(),
  status: z
    .union([z.enum(['online', 'offline', 'away', 'busy', 'idle']), FromRefSchema])
    .default('offline'),
  size: z.enum(['xs', 'sm', 'md', 'lg']).default('md'),
  showLabel: z.boolean().default(false),
  label: z.string().optional(),
  bordered: z.boolean().default(true),
  slots: slotsSchema(['root', 'dot', 'label']).optional(),
  testID: z.string().optional(),
})
