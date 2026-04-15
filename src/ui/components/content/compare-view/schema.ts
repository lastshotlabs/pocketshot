import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const SideSchema = z.object({
  label: z.string(),
  content: z.union([z.string(), FromRefSchema]),
})

export const CompareViewSchema = extendComponentSchema({
  id: z.string().optional(),
  left: SideSchema,
  right: SideSchema,
  mode: z.enum(['side-by-side', 'inline']).optional().default('side-by-side'),
  showLineNumbers: z.boolean().optional().default(true),
  highlightDiffs: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
