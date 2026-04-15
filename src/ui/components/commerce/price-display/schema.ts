import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import { extendComponentSchema } from '../../_base/schema'

export const PriceDisplaySchema = extendComponentSchema({
  id: z.string().optional(),
  amount: z.union([z.number(), z.string(), FromRefSchema]),
  currency: z.string().optional().default('USD'),
  locale: z.string().optional().default('en-US'),
  size: z.enum(['sm', 'md', 'lg', 'xl']).optional().default('md'),
  originalAmount: z.union([z.number(), FromRefSchema]).optional(),
  badge: z.string().optional(),
  color: z.string().optional(),
  testID: z.string().optional(),
})
