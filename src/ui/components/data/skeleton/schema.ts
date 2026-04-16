import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'

export const SkeletonSchema = extendComponentSchema({
  id: z.string().optional(),
  variant: z
    .enum(['text', 'avatar', 'card', 'list-item', 'custom', 'circular', 'rectangular'])
    .optional()
    .default('text'),
  lines: z.number().int().positive().optional().default(3),
  count: z.number().int().positive().optional().default(1),
  animated: z.boolean().optional().default(true),
  testID: z.string().optional(),
  slots: slotsSchema(['root', 'line', 'shape', 'title', 'body']).optional(),
})
