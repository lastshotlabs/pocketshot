
import { extendComponentSchema } from '../../_base'

export const ProgressCircleSchema = extendComponentSchema({
  id: z.string().optional(),
  value: z.union([z.number().min(0).max(100), z.object({ from: z.string() })]),
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  strokeWidth: z.number().positive().optional(),
  color: z.string().optional(),
  trackColor: z.string().optional(),
  showValue: z.boolean().optional().default(true),
  label: z.string().optional(),
  animated: z.boolean().optional().default(true),
  testID: z.string().optional(),
})

