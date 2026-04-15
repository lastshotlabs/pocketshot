import { z } from 'zod'
import { extendComponentSchema } from '../../_base'

export const SkeletonSchema = extendComponentSchema({
  id: z.string().optional(),
  variant: z.enum(['text', 'avatar', 'card', 'list-item', 'custom']).optional().default('text'),
  lines: z.number().int().positive().optional().default(3),
  width: z.union([z.number().positive(), z.string()]).optional(),
  height: z.number().positive().optional(),
  borderRadius: z.number().nonnegative().optional(),
  count: z.number().int().positive().optional().default(1),
  testID: z.string().optional(),
})
