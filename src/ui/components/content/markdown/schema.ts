import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const MarkdownSchema = z.object({
  id: z.string().optional(),
  content: z.union([z.string(), FromRefSchema]),
  fontSize: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  testID: z.string().optional(),
})

void ActionSchema
