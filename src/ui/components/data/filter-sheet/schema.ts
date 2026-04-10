import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const FilterSheetSectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['select', 'multi-select', 'range', 'toggle']),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
})

export const FilterSheetSchema = z.object({
  id: z.string(),
  title: z.string().optional().default('Filters'),
  sections: z.array(FilterSheetSectionSchema),
  onApply: ActionSchema,
  onReset: ActionSchema.optional(),
  testID: z.string().optional(),
})
