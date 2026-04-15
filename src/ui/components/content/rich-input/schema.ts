
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const RichInputSchema = extendComponentSchema({
  id: z.string(),
  value: z.union([z.string(), FromRefSchema]).optional(),
  defaultValue: z.string().optional(),
  placeholder: z.string().optional(),
  label: z.string().optional(),
  toolbar: z
    .array(
      z.enum([
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'code',
        'list-bullet',
        'list-number',
        'link',
        'quote',
      ]),
    )
    .optional()
    .default(['bold', 'italic', 'code', 'list-bullet']),
  minRows: z.number().optional().default(4),
  maxRows: z.number().optional().default(12),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})

