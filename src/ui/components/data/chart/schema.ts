import { z } from 'zod'
import { dimensionValueSchema, extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ChartDataItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
})

export const ChartSchema = extendComponentSchema({
  id: z.string().optional(),
  type: z.enum(['bar', 'line', 'donut', 'pie']).default('bar'),
  data: z.union([z.array(ChartDataItemSchema), FromRefSchema]),
  title: z.string().optional(),
  height: dimensionValueSchema.default(200),
  showLabels: z.boolean().default(true),
  showValues: z.boolean().default(false),
  showLegend: z.boolean().default(false),
  animated: z.boolean().default(true),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'legend',
    'legendItem',
    'tooltip',
    'series',
    'axis',
    'grid',
  ]).optional(),
})
