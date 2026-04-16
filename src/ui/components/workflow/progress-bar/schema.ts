import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import {
  dimensionValueSchema,
  extendComponentSchema,
  radiusValueSchema,
  slotsSchema,
} from '../../_base/schema'

export const ProgressBarSchema = extendComponentSchema({
  id: z.string().optional(),
  value: z.union([z.number().min(0).max(100), FromRefSchema]),
  label: z.union([z.string(), FromRefSchema]).optional(),
  showValue: z.boolean().optional().default(false),
  variant: z.enum(['default', 'success', 'warning', 'error']).optional().default('default'),
  animated: z.boolean().optional().default(true),
  height: dimensionValueSchema.optional().default(8),
  borderRadius: radiusValueSchema.optional().default('full'),
  testID: z.string().optional(),
  slots: slotsSchema(['root', 'labelRow', 'label', 'value', 'track', 'fill']).optional(),
})
