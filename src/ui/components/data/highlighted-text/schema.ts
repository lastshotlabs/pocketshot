import { z } from 'zod'
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const HighlightedTextSchema = extendComponentSchema({
  id: z.string().optional(),
  text: z.union([z.string(), FromRefSchema]),
  highlights: z.union([z.array(z.string()), FromRefSchema]),
  highlightColor: z.string().optional(),
  highlightForeground: z.string().optional(),
  fontSize: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional().default('md'),
  testID: z.string().optional(),
})
