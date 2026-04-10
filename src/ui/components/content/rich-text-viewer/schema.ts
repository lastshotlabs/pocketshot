import { z } from 'zod'

const FromRefSchema = z.object({ from: z.string() })

export const RichTextViewerSchema = z.object({
  id: z.string().optional(),
  content: z.union([z.string(), FromRefSchema]),
  maxLines: z.number().optional(),
  showExpandButton: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
