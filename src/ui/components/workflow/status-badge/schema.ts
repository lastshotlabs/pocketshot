import { z } from 'zod'

const StatusColorSchema = z.enum(['primary', 'success', 'warning', 'error', 'info', 'default'])

export const StatusBadgeSchema = z.object({
  id: z.string().optional(),
  status: z.union([z.string(), z.object({ from: z.string() })]),
  statusMap: z
    .record(
      z.string(),
      z.object({
        label: z.string(),
        color: StatusColorSchema,
      }),
    )
    .optional(),
  size: z.enum(['sm', 'md']).optional().default('md'),
  showDot: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
