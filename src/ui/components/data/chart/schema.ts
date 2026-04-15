import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'


const ChartDataItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
})

export const ChartSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['bar', 'line', 'donut', 'pie']).default('bar'),
  data: z.union([z.array(ChartDataItemSchema), FromRefSchema]),
  title: z.string().optional(),
  height: z.number().int().min(40).default(200),
  showLabels: z.boolean().default(true),
  showValues: z.boolean().default(false),
  showLegend: z.boolean().default(false),
  animated: z.boolean().default(true),
  testID: z.string().optional(),
})
