import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const MarkdownSchema = extendComponentSchema({
  id: z.string().optional(),
  content: z.union([z.string(), FromRefSchema]),
  fontSize: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  testID: z.string().optional(),
})
