import { z } from 'zod'

export const SectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  padding: z.number().optional().default(4),
  titleSize: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  children: z.array(z.unknown()).optional(),
  testID: z.string().optional(),
})
