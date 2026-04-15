import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'


export const LabelSchema = z.object({
  id: z.string().optional(),
  text: z.union([z.string(), FromRefSchema]),
  variant: z.enum(['default', 'muted', 'error', 'success']).optional().default('default'),
  size: z.enum(['xs', 'sm', 'md']).optional().default('sm'),
  uppercase: z.boolean().optional().default(false),
  testID: z.string().optional(),
})
