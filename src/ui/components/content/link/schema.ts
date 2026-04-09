import { z } from 'zod'
import type { Action } from '../../../actions/types'

const FromRefSchema = z.object({ from: z.string() })
const ActionSchema = z.custom<Action>()

export const LinkSchema = z.object({
  id: z.string().optional(),
  text: z.union([z.string(), FromRefSchema]),
  action: ActionSchema,
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  underline: z.boolean().optional().default(true),
  testID: z.string().optional(),
})
