import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const TimePickerSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional().default('Select a time'),
  defaultValue: z.union([z.string(), FromRefSchema]).optional(),
  is24Hour: z.boolean().optional().default(false),
  minuteInterval: z.union([
    z.literal(1),
    z.literal(5),
    z.literal(10),
    z.literal(15),
    z.literal(30),
  ]).optional().default(1),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
})
