import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const TimePickerSchema = extendComponentSchema({
  id: z.string(),
  label: z.union([z.string(), FromRefSchema]).optional(),
  placeholder: z.union([z.string(), FromRefSchema]).optional().default('Select a time'),
  defaultValue: z.union([z.string(), FromRefSchema]).optional(),
  is24Hour: z.boolean().optional().default(false),
  minuteInterval: z
    .union([z.literal(1), z.literal(5), z.literal(10), z.literal(15), z.literal(30)])
    .optional()
    .default(1),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'container',
    'label',
    'trigger',
    'triggerText',
    'clockIcon',
    'backdrop',
    'pickerPanel',
    'pickerTitle',
    'columnsRow',
    'columnContainer',
    'columnHighlight',
    'columnScroll',
    'columnItem',
    'columnItemText',
    'separator',
    'periodColumn',
    'periodButton',
    'periodText',
    'footer',
    'confirmButton',
    'confirmButtonText',
  ]).optional(),
})
