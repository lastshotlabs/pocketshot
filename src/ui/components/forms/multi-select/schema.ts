import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const MultiSelectSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional().default('Select options…'),
  options: z.array(z.object({ value: z.string(), label: z.string() })),
  value: z.union([z.array(z.string()), FromRefSchema]).optional(),
  defaultValue: z.array(z.string()).optional(),
  maxSelections: z.number().optional(),
  emptyMessage: z.string().optional().default('No options'),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
