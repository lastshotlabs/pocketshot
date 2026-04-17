import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const DatePickerSchema = extendComponentSchema({
  id: z.string(),
  label: z.union([z.string(), FromRefSchema]).optional(),
  placeholder: z.union([z.string(), FromRefSchema]).optional().default('Select a date'),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  defaultValue: z.union([z.string(), FromRefSchema]).optional(),
  format: z.string().optional().default('MM/DD/YYYY'),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'container',
    'label',
    'trigger',
    'triggerText',
    'calendarIcon',
    'backdrop',
    'pickerPanel',
    'navRow',
    'navButton',
    'navArrow',
    'navTitle',
    'grid',
    'dayLabelsRow',
    'dayLabelCell',
    'dayLabelText',
    'dayRow',
    'dayCell',
    'dayText',
    'footer',
    'todayLink',
  ]).optional(),
})
