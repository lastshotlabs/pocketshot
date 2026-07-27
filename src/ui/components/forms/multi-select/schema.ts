import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const MultiSelectSchema = extendComponentSchema({
  id: z.string(),
  label: z.union([z.string(), FromRefSchema]).optional(),
  placeholder: z.union([z.string(), FromRefSchema]).optional().default('Select options...'),
  options: z.array(z.object({ value: z.string(), label: z.string() })),
  value: z.union([z.array(z.string()), FromRefSchema]).optional(),
  defaultValue: z.array(z.string()).optional(),
  maxSelections: z.number().optional(),
  emptyMessage: z.union([z.string(), FromRefSchema]).optional().default('No options'),
  onChangeAction: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'container',
    'label',
    'trigger',
    'triggerContent',
    'chipsContainer',
    'chip',
    'chipText',
    'chipRemove',
    'chipRemoveText',
    'placeholderText',
    'chevron',
    'backdrop',
    'panel',
    'panelHeader',
    'panelTitle',
    'searchContainer',
    'searchInput',
    'optionList',
    'optionRow',
    'checkboxIcon',
    'optionLabel',
    'emptyText',
    'panelFooter',
    'doneButton',
    'doneButtonText',
  ]).optional(),
})
