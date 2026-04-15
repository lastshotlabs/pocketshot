import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema } from '../../_base/schema'

const StatusColorSchema = z.enum(['primary', 'success', 'warning', 'error', 'info', 'default'])

export const StatusBadgeSchema = extendComponentSchema({
  id: z.string().optional(),
  status: z.union([z.string(), FromRefSchema]),
  statusMap: z
    .record(
      z.string(),
      z.object({
        label: z.string(),
        color: StatusColorSchema,
      }),
    )
    .optional(),
  size: z.enum(['sm', 'md']).optional().default('md'),
  showDot: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
