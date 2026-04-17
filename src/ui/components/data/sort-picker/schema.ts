import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const SortPickerSchema = extendComponentSchema({
  id: z.string(),
  options: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
      icon: z.string().optional(),
    }),
  ),
  value: z.union([z.string(), FromRefSchema]).optional(),
  defaultValue: z.string().optional(),
  onSelect: ActionSchema,
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'backdrop',
    'panel',
    'header',
    'title',
    'divider',
    'option',
    'optionLabel',
    'optionIcon',
    'checkmark',
    'cancelButton',
    'cancelLabel',
  ]).optional(),
})
