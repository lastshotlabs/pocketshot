import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const DatePickerSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional().default('Select a date'),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  defaultValue: z.union([z.string(), FromRefSchema]).optional(),
  format: z.string().optional().default('MM/DD/YYYY'),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
