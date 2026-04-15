import { z } from 'zod'
import { extendComponentSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const RichTextViewerSchema = extendComponentSchema({
  id: z.string().optional(),
  content: z.union([z.string(), FromRefSchema]),
  maxLines: z.number().optional(),
  showExpandButton: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
