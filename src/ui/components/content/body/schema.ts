import { z } from 'zod'

const FromRefSchema = z.object({ from: z.string() })

export const BodySchema = z.object({
  id: z.string().optional(),
  text: z.union([z.string(), FromRefSchema]),
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  weight: z.enum(['regular', 'medium', 'semibold', 'bold']).optional().default('regular'),
  color: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).optional().default('left'),
  numberOfLines: z.number().optional(),
  testID: z.string().optional(),
})
