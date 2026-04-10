import { z } from 'zod'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()
const FromRefSchema = z.object({ from: z.string() })

export const WizardFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'email', 'password', 'number', 'textarea', 'select', 'checkbox']),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().optional().default(false),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  defaultValue: z.union([z.string(), z.boolean()]).optional(),
  helperText: z.string().optional(),
})

export const WizardStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(WizardFieldSchema),
})

export const WizardSchema = z.object({
  id: z.string(),
  steps: z.array(WizardStepSchema),
  title: z.string().optional(),
  nextLabel: z.string().optional().default('Next'),
  backLabel: z.string().optional().default('Back'),
  submitLabel: z.string().optional().default('Submit'),
  cancelLabel: z.string().optional().default('Cancel'),
  showProgress: z.boolean().optional().default(true),
  onComplete: ActionSchema.optional(),
  onCancel: ActionSchema.optional(),
  testID: z.string().optional(),
})

// Re-export for convenience
export { FromRefSchema }
