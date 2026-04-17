import type { z } from 'zod'
import type { WizardSchema, WizardFieldSchema, WizardStepSchema } from './schema'

export type WizardConfig = z.input<typeof WizardSchema>
export type WizardField = z.input<typeof WizardFieldSchema>
export type WizardStep = z.input<typeof WizardStepSchema>

export type WizardFieldValues = Record<string, string | boolean | string[]>
export type WizardErrors = Record<string, string>
export type TransitionDirection = 'forward' | 'backward'
