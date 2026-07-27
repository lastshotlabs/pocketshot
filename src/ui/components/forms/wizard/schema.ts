import { z } from 'zod'
import { extendComponentSchema, slotsSchema } from '../../_base/schema'
import { fromRefSchema as FromRefSchema } from '@lastshotlabs/frontend-contract/refs'
import type { Action } from '../../../actions/types'

const ActionSchema = z.custom<Action>()

export const WizardFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'email', 'password', 'number', 'textarea', 'select', 'checkbox']),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().optional().default(false),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  defaultValue: z.union([z.string(), z.boolean()]).optional(),
  helperText: z.string().optional(),
})

export const WizardStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(WizardFieldSchema),
})

export const WizardSchema = extendComponentSchema({
  id: z.string(),
  steps: z.array(WizardStepSchema),
  title: z.union([z.string(), FromRefSchema]).optional(),
  nextLabel: z.union([z.string(), FromRefSchema]).optional().default('Next'),
  backLabel: z.union([z.string(), FromRefSchema]).optional().default('Back'),
  submitLabel: z.union([z.string(), FromRefSchema]).optional().default('Submit'),
  cancelLabel: z.union([z.string(), FromRefSchema]).optional().default('Cancel'),
  showProgress: z.boolean().optional().default(true),
  onComplete: ActionSchema.optional(),
  onCancel: ActionSchema.optional(),
  testID: z.string().optional(),
  slots: slotsSchema([
    'root',
    'keyboardAvoid',
    'container',
    'header',
    'title',
    'progressRow',
    'progressDots',
    'progressDot',
    'progressText',
    'stepContent',
    'scrollView',
    'scrollContent',
    'stepTitle',
    'stepDescription',
    'fieldsContainer',
    'fieldContainer',
    'fieldLabel',
    'required',
    'fieldInput',
    'fieldError',
    'fieldHelper',
    'checkboxRow',
    'checkboxBox',
    'checkboxMark',
    'checkboxLabel',
    'selectTrigger',
    'selectTriggerText',
    'chevron',
    'buttonRow',
    'buttonSpacer',
    'buttonRight',
    'button',
    'primaryButton',
    'outlineButton',
    'ghostButton',
    'buttonText',
    'selectBackdrop',
    'selectSheet',
    'selectSheetInner',
    'selectSheetTitle',
    'selectOption',
    'selectOptionText',
    'checkmark',
  ]).optional(),
})

export { FromRefSchema }
