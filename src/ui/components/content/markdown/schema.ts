
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const MarkdownSchema = extendComponentSchema({
  id: z.string().optional(),
  content: z.union([z.string(), FromRefSchema]),
  fontSize: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  testID: z.string().optional(),
})

void ActionSchema

