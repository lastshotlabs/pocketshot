import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const FilterSheetSectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['select', 'multi-select', 'range', 'toggle']),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
})

export const FilterSheetSchema = extendComponentSchema({
  id: z.string(),
  title: z.string().optional().default('Filters'),
  sections: z.array(FilterSheetSectionSchema),
  onApply: ActionSchema,
  onReset: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'backdrop',
    'panel',
    'header',
    'title',
    'closeButton',
    'closeText',
    'scrollContent',
    'section',
    'sectionLabel',
    'optionRow',
    'optionIndicator',
    'optionLabel',
    'rangeField',
    'rangeSeparator',
    'footer',
    'resetButton',
    'resetText',
    'applyButton',
    'applyText',
  ]).optional(),
})
