import { z } from 'zod'

const FromRefSchema = z.object({ from: z.string() })

export const HeadingSchema = z.object({
  id: z.string().optional(),
  text: z.union([z.string(), FromRefSchema]),
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]).optional().default(2),
  align: z.enum(['left', 'center', 'right']).optional().default('left'),
  color: z.string().optional(),
  testID: z.string().optional(),
})
