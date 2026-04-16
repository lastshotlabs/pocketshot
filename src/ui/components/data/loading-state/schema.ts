import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { dimensionValueSchema, extendComponentSchema, slotsSchema } from '../../_base/schema'

export const LoadingStateSchema = extendComponentSchema({
  id: z.string().optional(),
  variant: z.enum(['spinner', 'skeleton']).optional().default('skeleton'),
  count: z.number().int().positive().optional().default(3),
  height: dimensionValueSchema.optional().default(48),
  label: z.union([z.string(), FromRefSchema]).optional(),
  testID: z.string().optional(),
  slots: slotsSchema(['root', 'spinner', 'label', 'line']).optional(),
})
