import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema } from '../../_base/schema'

export const ProgressCircleSchema = extendComponentSchema({
  id: z.string().optional(),
  value: z.union([z.number().min(0).max(100), FromRefSchema]),
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  strokeWidth: z.number().positive().optional(),
  color: z.string().optional(),
  trackColor: z.string().optional(),
  showValue: z.boolean().optional().default(true),
  label: z.string().optional(),
  animated: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
