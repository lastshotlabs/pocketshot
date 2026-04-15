import { z } from 'zod'
import { extendComponentSchema, fontSizeValueSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const HighlightedTextSchema = extendComponentSchema({
  text: z.union([z.string(), FromRefSchema]),
  highlights: z.union([z.array(z.string()), FromRefSchema]),
  highlightColor: z.string().optional(),
  highlightForeground: z.string().optional(),
  fontSize: fontSizeValueSchema.optional().default('base'),
})
