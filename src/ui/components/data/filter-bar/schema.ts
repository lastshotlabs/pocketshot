import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const FilterOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  count: z.number().optional(),
})

export const FilterBarSchema = z.object({
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
