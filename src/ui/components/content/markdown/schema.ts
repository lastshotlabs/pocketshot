import { z } from 'zod'
import { extendComponentSchema, fontSizeValueSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

export const MarkdownSchema = extendComponentSchema({
  content: z.union([z.string(), FromRefSchema]),
  fontSize: fontSizeValueSchema.optional().default('base'),
})
