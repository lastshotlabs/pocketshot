
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const ToggleSchema = extendComponentSchema({
  id: z.string(),
  label: z.union([z.string(), FromRefSchema]).optional(),
  icon: z.string().optional(),
  value: z.union([z.boolean(), FromRefSchema]).optional(),
  defaultValue: z.boolean().optional().default(false),
  variant: z.enum(['default', 'primary', 'outline']).optional().default('default'),
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  disabled: z.union([z.boolean(), FromRefSchema]).optional(),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})

