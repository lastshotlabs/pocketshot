import { z } from 'zod'
import { extendComponentSchema, fontSizeValueSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const HighlightedTextSchema = extendComponentSchema({
  text: z.union([z.string(), FromRefSchema]),
  highlight: z.union([z.string(), FromRefSchema]).optional(),
  highlights: z.union([z.array(z.string()), FromRefSchema]).optional(),
  highlightColor: z.string().optional(),
  highlightForeground: z.string().optional(),
  caseSensitive: z.boolean().optional(),
  fontSize: fontSizeValueSchema.optional().default('base'),
  slots: slotsSchema(['root', 'mark']).optional(),
})
