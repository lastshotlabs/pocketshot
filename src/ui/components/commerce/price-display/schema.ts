import { z } from 'zod'

export const PriceDisplaySchema = z.object({
  id: z.string().optional(),
  amount: z.union([z.number(), z.string(), z.object({ from: z.string() })]),
  currency: z.string().optional().default('USD'),
  locale: z.string().optional().default('en-US'),
  size: z.enum(['sm', 'md', 'lg', 'xl']).optional().default('md'),
  originalAmount: z.union([z.number(), z.object({ from: z.string() })]).optional(),
  badge: z.string().optional(),
  color: z.string().optional(),
  testID: z.string().optional(),
})
