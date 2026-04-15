import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema } from '../../_base'

export const ProgressBarSchema = extendComponentSchema({
  id: z.string().optional(),
  value: z.union([z.number().min(0).max(100), FromRefSchema]),
  label: z.string().optional(),
  showValue: z.boolean().optional().default(false),
  variant: z.enum(['default', 'success', 'warning', 'error']).optional().default('default'),
  animated: z.boolean().optional().default(true),
  height: z.number().positive().optional().default(8),
  radius: z.enum(['none', 'sm', 'md', 'full']).optional().default('full'),
  testID: z.string().optional(),
})
