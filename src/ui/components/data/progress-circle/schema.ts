import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'

export const ProgressCircleSchema = extendComponentSchema({
  id: z.string().optional(),
  value: z.union([z.number().min(0).max(100), FromRefSchema]),
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  strokeWidth: z.number().positive().optional(),
  trackColor: z.string().optional(),
  showValue: z.boolean().optional().default(true),
  label: z.union([z.string(), FromRefSchema]).optional(),
  animated: z.boolean().optional().default(true),
  testID: z.string().optional(),
  slots: slotsSchema(['root', 'label', 'value', 'circularTrack', 'circularFill']).optional(),
})
