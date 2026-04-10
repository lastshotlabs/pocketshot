import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const DateRangePickerSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  startPlaceholder: z.string().optional().default('Start date'),
  endPlaceholder: z.string().optional().default('End date'),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  defaultStart: z.union([z.string(), FromRefSchema]).optional(),
  defaultEnd: z.union([z.string(), FromRefSchema]).optional(),
  format: z.string().optional().default('MM/DD/YYYY'),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
