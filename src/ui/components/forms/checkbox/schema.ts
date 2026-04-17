import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

export const CheckboxSchema = extendComponentSchema({
  id: z.string(),
  label: z.string(),
  defaultChecked: z.boolean().optional().default(false),
  checked: z.union([z.boolean(), FromRefSchema]).optional(),
  onChangeAction: ActionSchema.optional(),
  disabled: z.boolean().optional().default(false),
  slots: slotsSchema(['root', 'row', 'box', 'checkmark', 'label']).optional(),
})
