import { z } from 'zod'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'


export const RichTextViewerSchema = z.object({
  id: z.string().optional(),
  content: z.union([z.string(), FromRefSchema]),
  maxLines: z.number().optional(),
  showExpandButton: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
