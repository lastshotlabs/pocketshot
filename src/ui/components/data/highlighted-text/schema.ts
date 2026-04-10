import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const HighlightedTextSchema = z.object({
  id: z.string().optional(),
  text: z.union([z.string(), FromRefSchema]),
  highlights: z.union([z.array(z.string()), FromRefSchema]),
  highlightColor: z.string().optional(),
  highlightForeground: z.string().optional(),
  fontSize: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional().default('md'),
  testID: z.string().optional(),
})
