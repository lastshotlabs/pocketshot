
import { extendComponentSchema } from '../../_base'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const FilterOptionSchema = extendComponentSchema({
  id: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  count: z.number().optional(),
})

export const FilterBarSchema = extendComponentSchema({
  id: z.string().optional(),
  filters: z.array(FilterOptionSchema),
  value: z.union([z.string(), z.array(z.string()), FromRefSchema]).optional(),
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
  multiSelect: z.boolean().optional().default(false),
  showAllOption: z.boolean().optional().default(true),
  allLabel: z.string().optional().default('All'),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})

