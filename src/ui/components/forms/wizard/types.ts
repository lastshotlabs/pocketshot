import type { z } from 'zod'
import type { WizardSchema, WizardFieldSchema, WizardStepSchema } from './schema'

export type WizardConfig = z.infer<typeof WizardSchema>
export type WizardField = z.infer<typeof WizardFieldSchema>
export type WizardStep = z.infer<typeof WizardStepSchema>

/** All field values collected across all wizard steps, keyed as `${stepId}.${fieldId}` */
export type WizardFieldValues = Record<string, string | boolean | string[]>

/** Validation errors for wizard fields, keyed as `${stepId}.${fieldId}` */
export type WizardErrors = Record<string, string>

/** Direction of the step transition animation */
export type TransitionDirection = 'forward' | 'backward'
