import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const CodeBlockSchema = z.object({
  id: z.string().optional(),
  code: z.union([z.string(), FromRefSchema]),
  language: z.string().optional(),
  showLineNumbers: z.boolean().optional().default(true),
  showCopyButton: z.boolean().optional().default(true),
  maxLines: z.number().optional(),
  onCopy: ActionSchema.optional(),
  testID: z.string().optional(),
})
